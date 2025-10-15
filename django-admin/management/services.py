import requests
import logging
from typing import Dict, List, Optional, Any
from django.conf import settings
from django.utils import timezone
from .models import Vote, VoteResults, SystemLog

logger = logging.getLogger(__name__)


class VotingAPIService:
    """Service to interact with the Express.js voting backend API"""
    
    def __init__(self):
        self.base_url = settings.VOTING_API_BASE_URL
        self.timeout = 30
    
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                     user: Optional[str] = None, ip_address: Optional[str] = None) -> Dict[str, Any]:
        """Make HTTP request to the voting API with logging"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            # Log the API call
            SystemLog.objects.create(
                level='INFO',
                action_type='API_CALL',
                message=f"{method} {endpoint}",
                details={'url': url, 'data': data},
                user=user,
                ip_address=ip_address
            )
            
            if method.upper() == 'GET':
                response = requests.get(url, timeout=self.timeout)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, timeout=self.timeout)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            result = response.json()
            
            # Log successful response
            SystemLog.objects.create(
                level='SUCCESS',
                action_type='API_CALL',
                message=f"API call successful: {method} {endpoint}",
                details={'status_code': response.status_code, 'response': result},
                user=user,
                ip_address=ip_address
            )
            
            return result
            
        except requests.exceptions.RequestException as e:
            error_msg = f"API request failed: {method} {endpoint} - {str(e)}"
            logger.error(error_msg)
            
            # Log the error
            SystemLog.objects.create(
                level='ERROR',
                action_type='API_CALL',
                message=error_msg,
                details={'error': str(e), 'url': url, 'data': data},
                user=user,
                ip_address=ip_address
            )
            
            raise Exception(error_msg)
    
    def health_check(self) -> Dict[str, Any]:
        """Check if the voting API is healthy"""
        return self._make_request('GET', '/api/health')
    
    def get_results(self, user: Optional[str] = None, ip_address: Optional[str] = None) -> Dict[str, Any]:
        """Get current vote results from the API"""
        return self._make_request('GET', '/api/results', user=user, ip_address=ip_address)
    
    def get_vote_status(self, identifier: str, user: Optional[str] = None, 
                       ip_address: Optional[str] = None) -> Dict[str, Any]:
        """Check if a user has voted"""
        return self._make_request('GET', f'/api/vote-status/{identifier}', 
                                user=user, ip_address=ip_address)
    
    def submit_vote(self, user_team: str, voted_for: str, user_identifier: str,
                   user: Optional[str] = None, ip_address: Optional[str] = None) -> Dict[str, Any]:
        """Submit a vote to the API"""
        data = {
            'userTeam': user_team,
            'votedFor': voted_for,
            'userIdentifier': user_identifier
        }
        return self._make_request('POST', '/api/vote', data=data, user=user, ip_address=ip_address)
    
    def get_all_votes(self, user: Optional[str] = None, ip_address: Optional[str] = None) -> Dict[str, Any]:
        """Get all votes (admin endpoint)"""
        return self._make_request('GET', '/api/admin/votes', user=user, ip_address=ip_address)
    
    def reset_votes(self, user: Optional[str] = None, ip_address: Optional[str] = None) -> Dict[str, Any]:
        """Reset all votes (admin endpoint)"""
        data = {'confirm': 'RESET_ALL_VOTES'}
        return self._make_request('POST', '/api/admin/reset', data=data, user=user, ip_address=ip_address)
    
    def reset_devices(self, user: Optional[str] = None, ip_address: Optional[str] = None) -> Dict[str, Any]:
        """Reset all device IDs (admin endpoint) - allows all users to vote again"""
        data = {'confirm': 'RESET_ALL_DEVICES'}
        return self._make_request('POST', '/api/admin/reset-devices', data=data, user=user, ip_address=ip_address)
    
    def get_device_stats(self, user: Optional[str] = None, ip_address: Optional[str] = None) -> Dict[str, Any]:
        """Get device/voter statistics (admin endpoint)"""
        return self._make_request('GET', '/api/admin/devices', user=user, ip_address=ip_address)


class VotingDataService:
    """Service to manage voting data synchronization and local storage"""
    
    def __init__(self):
        self.api = VotingAPIService()
    
    def sync_votes_from_backend(self, user: Optional[str] = None, ip_address: Optional[str] = None) -> int:
        """Sync votes from backend API to local database"""
        try:
            # Get all votes from backend
            response = self.api.get_all_votes(user=user, ip_address=ip_address)
            votes_data = response.get('votes', [])
            
            # Clear existing votes and sync new ones
            Vote.objects.all().delete()
            
            synced_count = 0
            for vote_data in votes_data:
                # Map backend data to our model
                vote = Vote.objects.create(
                    vote_id=vote_data.get('id', ''),
                    user_team=self._map_team_name_to_id(vote_data.get('userTeam', '')),
                    voted_for=self._map_team_name_to_id(vote_data.get('votedFor', '')),
                    timestamp=vote_data.get('timestamp', timezone.now()),
                    user_identifier=f"backend-{vote_data.get('id', '')[:8]}",  # Placeholder
                    synced_with_backend=True
                )
                synced_count += 1
            
            # Log sync operation
            SystemLog.objects.create(
                level='SUCCESS',
                action_type='VOTE_SYNC',
                message=f"Successfully synced {synced_count} votes from backend",
                details={'synced_count': synced_count, 'total_backend_votes': len(votes_data)},
                user=user,
                ip_address=ip_address
            )
            
            return synced_count
            
        except Exception as e:
            error_msg = f"Failed to sync votes from backend: {str(e)}"
            logger.error(error_msg)
            
            SystemLog.objects.create(
                level='ERROR',
                action_type='VOTE_SYNC',
                message=error_msg,
                details={'error': str(e)},
                user=user,
                ip_address=ip_address
            )
            
            raise Exception(error_msg)
    
    def sync_results_from_backend(self, user: Optional[str] = None, ip_address: Optional[str] = None) -> int:
        """Sync vote results from backend API to local database"""
        try:
            # Get results from backend
            response = self.api.get_results(user=user, ip_address=ip_address)
            results_data = response.get('results', [])
            total_votes = response.get('totalVotes', 0)
            
            # Clear existing results and sync new ones
            VoteResults.objects.all().delete()
            
            synced_count = 0
            for result_data in results_data:
                result = VoteResults.objects.create(
                    team_id=result_data.get('teamId', ''),
                    team_name=result_data.get('teamName', ''),
                    vote_count=result_data.get('votes', 0),
                    percentage=result_data.get('percentage', 0.0),
                    total_votes=total_votes
                )
                synced_count += 1
            
            # Log sync operation
            SystemLog.objects.create(
                level='SUCCESS',
                action_type='RESULTS_SYNC',
                message=f"Successfully synced results for {synced_count} teams",
                details={'synced_count': synced_count, 'total_votes': total_votes},
                user=user,
                ip_address=ip_address
            )
            
            return synced_count
            
        except Exception as e:
            error_msg = f"Failed to sync results from backend: {str(e)}"
            logger.error(error_msg)
            
            SystemLog.objects.create(
                level='ERROR',
                action_type='RESULTS_SYNC',
                message=error_msg,
                details={'error': str(e)},
                user=user,
                ip_address=ip_address
            )
            
            raise Exception(error_msg)
    
    def _map_team_name_to_id(self, team_name: str) -> str:
        """Map team display name back to team ID"""
        team_mapping = {
            'Team 01': 'team-a',
            'Team 02': 'team-b',
            'Team 03': 'team-c',
            'Team 04': 'team-d',
        }
        return team_mapping.get(team_name, team_name.lower().replace(' ', '-'))
    
    def get_dashboard_stats(self) -> Dict[str, Any]:
        """Get dashboard statistics"""
        try:
            # Try to get fresh data from backend
            results_response = self.api.get_results()
            votes_response = self.api.get_all_votes()
            
            return {
                'total_votes': results_response.get('totalVotes', 0),
                'unique_voters': votes_response.get('uniqueVoters', 0),
                'results': results_response.get('results', []),
                'last_updated': timezone.now(),
                'backend_connected': True
            }
            
        except Exception as e:
            # Fallback to local data if backend is unavailable
            logger.warning(f"Backend unavailable, using local data: {str(e)}")
            
            local_results = VoteResults.objects.all()
            total_votes = local_results.first().total_votes if local_results.exists() else 0
            
            return {
                'total_votes': total_votes,
                'unique_voters': Vote.objects.values('user_identifier').distinct().count(),
                'results': [
                    {
                        'teamId': result.team_id,
                        'teamName': result.team_name,
                        'votes': result.vote_count,
                        'percentage': result.percentage
                    }
                    for result in local_results
                ],
                'last_updated': local_results.first().last_updated if local_results.exists() else None,
                'backend_connected': False
            }
    
    def reset_all_data(self, user: Optional[str] = None, ip_address: Optional[str] = None) -> bool:
        """Reset all voting data both locally and on backend"""
        try:
            # Reset backend data
            self.api.reset_votes(user=user, ip_address=ip_address)
            
            # Reset local data
            Vote.objects.all().delete()
            VoteResults.objects.all().delete()
            
            # Log the reset action
            SystemLog.objects.create(
                level='WARNING',
                action_type='ADMIN_ACTION',
                message="All voting data has been reset",
                details={'action': 'reset_all_data'},
                user=user,
                ip_address=ip_address
            )
            
            return True
            
        except Exception as e:
            error_msg = f"Failed to reset voting data: {str(e)}"
            logger.error(error_msg)
            
            SystemLog.objects.create(
                level='ERROR',
                action_type='ADMIN_ACTION',
                message=error_msg,
                details={'error': str(e), 'action': 'reset_all_data'},
                user=user,
                ip_address=ip_address
            )
            
            return False
    
    def reset_device_ids(self, user: Optional[str] = None, ip_address: Optional[str] = None) -> bool:
        """Reset all device IDs - allows all users to vote again without clearing votes"""
        try:
            # Reset device IDs on backend
            response = self.api.reset_devices(user=user, ip_address=ip_address)
            
            # Log the reset action
            SystemLog.objects.create(
                level='WARNING',
                action_type='ADMIN_ACTION',
                message=f"All device IDs have been reset. {response.get('previousVoterCount', 0)} users can now vote again.",
                details={'action': 'reset_device_ids', 'response': response},
                user=user,
                ip_address=ip_address
            )
            
            return True
            
        except Exception as e:
            error_msg = f"Failed to reset device IDs: {str(e)}"
            logger.error(error_msg)
            
            SystemLog.objects.create(
                level='ERROR',
                action_type='ADMIN_ACTION',
                message=error_msg,
                details={'error': str(e), 'action': 'reset_device_ids'},
                user=user,
                ip_address=ip_address
            )
            
            return False
    
    def get_device_statistics(self, user: Optional[str] = None, ip_address: Optional[str] = None) -> Dict[str, Any]:
        """Get device/voter statistics from backend"""
        try:
            response = self.api.get_device_stats(user=user, ip_address=ip_address)
            
            SystemLog.objects.create(
                level='INFO',
                action_type='API_CALL',
                message="Retrieved device statistics",
                details={'response': response},
                user=user,
                ip_address=ip_address
            )
            
            return response
            
        except Exception as e:
            error_msg = f"Failed to get device statistics: {str(e)}"
            logger.error(error_msg)
            
            SystemLog.objects.create(
                level='ERROR',
                action_type='API_CALL',
                message=error_msg,
                details={'error': str(e), 'action': 'get_device_statistics'},
                user=user,
                ip_address=ip_address
            )
            
            return {
                'totalUniqueDevices': 0,
                'totalVotes': 0,
                'devicesWithVotes': [],
                'error': str(e)
            }

from django.shortcuts import render, redirect
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from django.core.paginator import Paginator
from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_datetime
import json
import logging

from .models import Vote, VoteResults, SystemLog
from .services import VotingAPIService, VotingDataService

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class DashboardView(View):
    """Main dashboard view showing voting statistics and overview"""
    
    def get(self, request):
        try:
            data_service = VotingDataService()
            api_service = VotingAPIService()
            stats = data_service.get_dashboard_stats()

            # Get all votes from backend admin endpoint and aggregate by voter name
            backend_votes_response = api_service.get_all_votes()
            backend_votes = backend_votes_response.get('votes', [])

            # Aggregate votes by voter name (combine votedFor for the same name)
            name_to_votes = {}
            for v in backend_votes:
                # Normalize fields from backend
                voter_name = (v.get('name') or '').strip()
                if not voter_name:
                    voter_name = 'Anonymous'

                voted_for_display = v.get('votedFor') or ''  # Already a display name like "Team 01"
                user_team_display = v.get('userTeam') or ''   # Display name if present
                ip_addr = v.get('ipAddress')
                ts = parse_datetime(v.get('timestamp')) if v.get('timestamp') else None

                if voter_name not in name_to_votes:
                    name_to_votes[voter_name] = {
                        'name': voter_name,
                        'team_display_name': user_team_display,
                        'voted_for_set': set(),
                        'timestamp': ts,
                        'ip_address': ip_addr,
                        'user_identifier': '',
                    }

                entry = name_to_votes[voter_name]
                if voted_for_display:
                    entry['voted_for_set'].add(voted_for_display)
                # Prefer non-empty team name; keep latest timestamp/ip
                if user_team_display and not entry['team_display_name']:
                    entry['team_display_name'] = user_team_display
                if ts and (entry['timestamp'] is None or ts > entry['timestamp']):
                    entry['timestamp'] = ts
                    entry['ip_address'] = ip_addr

            # Convert to list for template with combined voted_for
            recent_votes = []
            for agg in name_to_votes.values():
                combined = dict(agg)
                combined['voted_for_display_name'] = ', '.join(sorted(list(agg['voted_for_set']))) if agg['voted_for_set'] else ''
                # Remove helper set
                combined.pop('voted_for_set', None)
                recent_votes.append(combined)

            # Sort by latest timestamp desc and limit
            recent_votes.sort(key=lambda x: x.get('timestamp') or timezone.make_aware(timezone.datetime.min), reverse=True)
            recent_votes = recent_votes[:10]

            # Calculate named vs anonymous counts
            named_voters_count = sum(1 for rv in recent_votes if rv.get('name') and rv.get('name').strip() and rv.get('name') != 'Anonymous')
            anonymous_voters_count = sum(1 for rv in recent_votes if not rv.get('name') or rv.get('name') == 'Anonymous')
            
            # Get recent logs
            recent_logs = SystemLog.objects.order_by('-timestamp')[:10]
            
            # Get team performance data for charts
            # Ensure all 4 teams are present and sort by votes desc so the first is the true leader
            backend_results = stats.get('results', []) or []
            name_to_result = {r.get('teamName'): r for r in backend_results}

            team_performance = []
            for team_code, team_display_name in Vote.TEAM_CHOICES:
                r = name_to_result.get(team_display_name, {})
                team_performance.append({
                    'name': team_display_name,
                    'votes': int(r.get('votes', 0) or 0),
                    'percentage': float(r.get('percentage', 0.0) or 0.0),
                })

            team_performance.sort(key=lambda t: t['votes'], reverse=True)
            
            context = {
                'stats': stats,
                'recent_votes': recent_votes,
                'recent_logs': recent_logs,
                'team_performance': team_performance,
                'named_voters_count': named_voters_count,
                'anonymous_voters_count': anonymous_voters_count,
                'page_title': 'Dashboard'
            }
            
            return render(request, 'management/dashboard.html', context)
            
        except Exception as e:
            logger.error(f"Dashboard error: {str(e)}")
            messages.error(request, f"Error loading dashboard: {str(e)}")
            
            # Fallback context
            context = {
                'stats': {'total_votes': 0, 'unique_voters': 0, 'backend_connected': False},
                'recent_votes': [],
                'recent_logs': [],
                'team_performance': [],
                'named_voters_count': 0,
                'anonymous_voters_count': 0,
                'page_title': 'Dashboard'
            }
            return render(request, 'management/dashboard.html', context)


class VotesListView(View):
    """View to list and manage all votes"""
    
    def get(self, request):
        try:
            # Get query parameters
            search = request.GET.get('search', '')
            team_filter = request.GET.get('team', '')
            page = request.GET.get('page', 1)
            
            # Build queryset
            votes = Vote.objects.all()
            
            if search:
                votes = votes.filter(
                    Q(user_identifier__icontains=search) |
                    Q(vote_id__icontains=search) |
                    Q(ip_address__icontains=search)
                )
            
            if team_filter:
                votes = votes.filter(user_team=team_filter)
            
            votes = votes.order_by('-timestamp')
            
            # Pagination
            paginator = Paginator(votes, 25)
            votes_page = paginator.get_page(page)
            
            # Team choices for filter
            team_choices = Vote.TEAM_CHOICES
            
            context = {
                'votes': votes_page,
                'search': search,
                'team_filter': team_filter,
                'team_choices': team_choices,
                'page_title': 'All Votes'
            }
            
            return render(request, 'management/votes_list.html', context)
            
        except Exception as e:
            logger.error(f"Votes list error: {str(e)}")
            messages.error(request, f"Error loading votes: {str(e)}")
            return render(request, 'management/votes_list.html', {'votes': [], 'page_title': 'All Votes'})


class ResultsView(View):
    """View to display voting results and analytics"""
    
    def get(self, request):
        try:
            data_service = VotingDataService()
            stats = data_service.get_dashboard_stats()
            
            # Get detailed results
            results = VoteResults.objects.all().order_by('-vote_count')
            
            # Calculate additional analytics
            analytics = {
                'total_votes': stats.get('total_votes', 0),
                'unique_voters': stats.get('unique_voters', 0),
                'backend_connected': stats.get('backend_connected', False),
                'last_updated': stats.get('last_updated'),
            }
            
            # Prepare chart data
            chart_data = {
                'labels': [result.team_name for result in results],
                'votes': [result.vote_count for result in results],
                'percentages': [result.percentage for result in results]
            }
            
            context = {
                'results': results,
                'analytics': analytics,
                'chart_data': chart_data,
                'page_title': 'Voting Results'
            }
            
            return render(request, 'management/results.html', context)
            
        except Exception as e:
            logger.error(f"Results view error: {str(e)}")
            messages.error(request, f"Error loading results: {str(e)}")
            return render(request, 'management/results.html', {'results': [], 'page_title': 'Voting Results'})


class SystemLogsView(View):
    """View to display system logs and activities"""
    
    def get(self, request):
        try:
            # Get query parameters
            level_filter = request.GET.get('level', '')
            action_filter = request.GET.get('action', '')
            search = request.GET.get('search', '')
            page = request.GET.get('page', 1)
            
            # Build queryset
            logs = SystemLog.objects.all()
            
            if level_filter:
                logs = logs.filter(level=level_filter)
            
            if action_filter:
                logs = logs.filter(action_type=action_filter)
            
            if search:
                logs = logs.filter(
                    Q(message__icontains=search) |
                    Q(user__icontains=search)
                )
            
            logs = logs.order_by('-timestamp')
            
            # Pagination
            paginator = Paginator(logs, 50)
            logs_page = paginator.get_page(page)
            
            # Filter choices
            level_choices = SystemLog.LOG_LEVELS
            action_choices = SystemLog.ACTION_TYPES
            
            context = {
                'logs': logs_page,
                'level_filter': level_filter,
                'action_filter': action_filter,
                'search': search,
                'level_choices': level_choices,
                'action_choices': action_choices,
                'page_title': 'System Logs'
            }
            
            return render(request, 'management/system_logs.html', context)
            
        except Exception as e:
            logger.error(f"System logs error: {str(e)}")
            messages.error(request, f"Error loading logs: {str(e)}")
            return render(request, 'management/system_logs.html', {'logs': [], 'page_title': 'System Logs'})


class AdminActionsView(View):
    """View for administrative actions"""
    
    def get(self, request):
        try:
            api_service = VotingAPIService()
            
            # Check backend health
            try:
                health = api_service.health_check()
                backend_status = 'healthy'
                backend_info = health
            except Exception as e:
                backend_status = 'error'
                backend_info = {'error': str(e)}
            
            context = {
                'backend_status': backend_status,
                'backend_info': backend_info,
                'page_title': 'Admin Actions'
            }
            
            return render(request, 'management/admin_actions.html', context)
            
        except Exception as e:
            logger.error(f"Admin actions error: {str(e)}")
            messages.error(request, f"Error loading admin panel: {str(e)}")
            return render(request, 'management/admin_actions.html', {'page_title': 'Admin Actions'})


# AJAX/API Views

@csrf_exempt
@require_http_methods(["POST"])
def sync_votes_ajax(request):
    """AJAX endpoint to sync votes from backend"""
    try:
        data_service = VotingDataService()
        user = request.user.username if request.user.is_authenticated else 'anonymous'
        ip_address = get_client_ip(request)
        
        synced_count = data_service.sync_votes_from_backend(user=user, ip_address=ip_address)
        
        return JsonResponse({
            'success': True,
            'message': f'Successfully synced {synced_count} votes from backend',
            'synced_count': synced_count
        })
        
    except Exception as e:
        logger.error(f"Sync votes AJAX error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def sync_results_ajax(request):
    """AJAX endpoint to sync results from backend"""
    try:
        data_service = VotingDataService()
        user = request.user.username if request.user.is_authenticated else 'anonymous'
        ip_address = get_client_ip(request)
        
        synced_count = data_service.sync_results_from_backend(user=user, ip_address=ip_address)
        
        return JsonResponse({
            'success': True,
            'message': f'Successfully synced results for {synced_count} teams',
            'synced_count': synced_count
        })
        
    except Exception as e:
        logger.error(f"Sync results AJAX error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def reset_votes_ajax(request):
    """AJAX endpoint to reset all votes"""
    try:
        data = json.loads(request.body)
        confirm = data.get('confirm', False)
        
        if not confirm:
            return JsonResponse({
                'success': False,
                'error': 'Confirmation required'
            }, status=400)
        
        data_service = VotingDataService()
        user = request.user.username if request.user.is_authenticated else 'anonymous'
        ip_address = get_client_ip(request)
        
        success = data_service.reset_all_data(user=user, ip_address=ip_address)
        
        if success:
            return JsonResponse({
                'success': True,
                'message': 'All voting data has been reset successfully'
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'Failed to reset voting data'
            }, status=500)
        
    except Exception as e:
        logger.error(f"Reset votes AJAX error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@require_http_methods(["GET"])
def health_check_ajax(request):
    """AJAX endpoint to check backend health"""
    try:
        api_service = VotingAPIService()
        health = api_service.health_check()
        
        return JsonResponse({
            'success': True,
            'health': health,
            'backend_connected': True
        })
        
    except Exception as e:
        logger.error(f"Health check AJAX error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e),
            'backend_connected': False
        }, status=500)


@require_http_methods(["GET"])
def dashboard_stats_ajax(request):
    """AJAX endpoint to get dashboard statistics"""
    try:
        data_service = VotingDataService()
        stats = data_service.get_dashboard_stats()
        
        return JsonResponse({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"Dashboard stats AJAX error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def reset_devices_ajax(request):
    """AJAX endpoint to reset all device IDs"""
    try:
        data = json.loads(request.body)
        confirm = data.get('confirm', False)
        
        if not confirm:
            return JsonResponse({
                'success': False,
                'error': 'Confirmation required'
            }, status=400)
        
        data_service = VotingDataService()
        user = request.user.username if request.user.is_authenticated else 'anonymous'
        ip_address = get_client_ip(request)
        
        success = data_service.reset_device_ids(user=user, ip_address=ip_address)
        
        if success:
            return JsonResponse({
                'success': True,
                'message': 'All device IDs have been reset successfully. All users can now vote again.'
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'Failed to reset device IDs'
            }, status=500)
        
    except Exception as e:
        logger.error(f"Reset devices AJAX error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@require_http_methods(["GET"])
def device_stats_ajax(request):
    """AJAX endpoint to get device statistics"""
    try:
        data_service = VotingDataService()
        user = request.user.username if request.user.is_authenticated else 'anonymous'
        ip_address = get_client_ip(request)
        
        stats = data_service.get_device_statistics(user=user, ip_address=ip_address)
        
        return JsonResponse({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"Device stats AJAX error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
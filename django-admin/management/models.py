from django.db import models
from django.utils import timezone


class Vote(models.Model):
    """Model to represent a vote (for local tracking/caching)"""
    
    TEAM_CHOICES = [
        ('team-a', 'Team 01'),
        ('team-b', 'Team 02'),
        ('team-c', 'Team 03'),
        ('team-d', 'Team 04'),
    ]
    
    vote_id = models.CharField(max_length=100, unique=True, help_text="UUID from backend")
    user_team = models.CharField(max_length=10, choices=TEAM_CHOICES)
    voted_for = models.CharField(max_length=10, choices=TEAM_CHOICES)
    timestamp = models.DateTimeField(default=timezone.now)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_identifier = models.CharField(max_length=100, help_text="User identifier from frontend")
    
    # Local tracking fields
    synced_with_backend = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Vote'
        verbose_name_plural = 'Votes'
    
    def __str__(self):
        return f"{self.get_user_team_display()} voted for {self.get_voted_for_display()}"
    
    @property
    def team_display_name(self):
        return dict(self.TEAM_CHOICES).get(self.user_team, self.user_team)
    
    @property
    def voted_for_display_name(self):
        return dict(self.TEAM_CHOICES).get(self.voted_for, self.voted_for)


class VoteResults(models.Model):
    """Model to cache vote results from backend"""
    
    team_id = models.CharField(max_length=10, unique=True)
    team_name = models.CharField(max_length=50)
    vote_count = models.IntegerField(default=0)
    percentage = models.FloatField(default=0.0)
    
    # Metadata
    total_votes = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Vote Result'
        verbose_name_plural = 'Vote Results'
        ordering = ['-vote_count']
    
    def __str__(self):
        return f"{self.team_name}: {self.vote_count} votes ({self.percentage}%)"


class SystemLog(models.Model):
    """Model to log system activities and API interactions"""
    
    LOG_LEVELS = [
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('SUCCESS', 'Success'),
    ]
    
    ACTION_TYPES = [
        ('API_CALL', 'API Call'),
        ('VOTE_SYNC', 'Vote Sync'),
        ('RESULTS_SYNC', 'Results Sync'),
        ('ADMIN_ACTION', 'Admin Action'),
        ('ERROR', 'Error'),
    ]
    
    timestamp = models.DateTimeField(auto_now_add=True)
    level = models.CharField(max_length=10, choices=LOG_LEVELS, default='INFO')
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    message = models.TextField()
    details = models.JSONField(null=True, blank=True, help_text="Additional data as JSON")
    user = models.CharField(max_length=100, null=True, blank=True, help_text="User who performed action")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'System Log'
        verbose_name_plural = 'System Logs'
    
    def __str__(self):
        return f"[{self.level}] {self.action_type}: {self.message[:50]}"
from django.contrib import admin
from .models import Vote, VoteResults, SystemLog


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ['name', 'user_team', 'voted_for', 'timestamp', 'ip_address', 'synced_with_backend']
    list_filter = ['user_team', 'voted_for', 'synced_with_backend', 'timestamp']
    search_fields = ['name', 'user_identifier', 'vote_id', 'ip_address']
    readonly_fields = ['vote_id', 'timestamp', 'created_at', 'updated_at']
    ordering = ['-timestamp']
    
    fieldsets = (
        ('Vote Information', {
            'fields': ('vote_id', 'name', 'user_team', 'voted_for', 'timestamp')
        }),
        ('User Details', {
            'fields': ('user_identifier', 'ip_address')
        }),
        ('System Fields', {
            'fields': ('synced_with_backend', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(VoteResults)
class VoteResultsAdmin(admin.ModelAdmin):
    list_display = ['team_name', 'vote_count', 'percentage', 'total_votes', 'last_updated']
    list_filter = ['last_updated']
    search_fields = ['team_name', 'team_id']
    readonly_fields = ['last_updated']
    ordering = ['-vote_count']


@admin.register(SystemLog)
class SystemLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'level', 'action_type', 'message_short', 'user', 'ip_address']
    list_filter = ['level', 'action_type', 'timestamp']
    search_fields = ['message', 'user', 'ip_address']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']
    
    def message_short(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    message_short.short_description = 'Message'

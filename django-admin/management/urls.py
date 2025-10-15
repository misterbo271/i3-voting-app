from django.urls import path
from . import views

app_name = 'management'

urlpatterns = [
    # Main views
    path('', views.DashboardView.as_view(), name='dashboard'),
    path('votes/', views.VotesListView.as_view(), name='votes_list'),
    path('results/', views.ResultsView.as_view(), name='results'),
    path('logs/', views.SystemLogsView.as_view(), name='system_logs'),
    path('admin-actions/', views.AdminActionsView.as_view(), name='admin_actions'),
    
    # AJAX endpoints
    path('ajax/sync-votes/', views.sync_votes_ajax, name='sync_votes_ajax'),
    path('ajax/sync-results/', views.sync_results_ajax, name='sync_results_ajax'),
    path('ajax/reset-votes/', views.reset_votes_ajax, name='reset_votes_ajax'),
    path('ajax/reset-devices/', views.reset_devices_ajax, name='reset_devices_ajax'),
    path('ajax/device-stats/', views.device_stats_ajax, name='device_stats_ajax'),
    path('ajax/health-check/', views.health_check_ajax, name='health_check_ajax'),
    path('ajax/dashboard-stats/', views.dashboard_stats_ajax, name='dashboard_stats_ajax'),
]

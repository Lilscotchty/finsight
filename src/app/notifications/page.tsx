
"use client";

import React from "react";
import { useNotificationCenter } from "@/contexts/notification-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Bell, CheckCheck, Trash2, Info, AlertTriangle, ServerCog, BellRing, FileText, Sparkles, BellOff } from "lucide-react";
import type { AppNotification, NotificationType } from "@/types";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  BellRing,
  Info,
  AlertTriangle,
  ServerCog,
  Sparkles,
  FileText,
};

const NotificationIcon = ({ type, iconName }: { type: NotificationType; iconName?: string }) => {
  let SpecificIcon: React.ElementType = Bell;

  if (iconName && iconMap[iconName]) {
    SpecificIcon = iconMap[iconName];
  } else {
    switch (type) {
      case 'alert_trigger':
        SpecificIcon = BellRing;
        break;
      case 'site_message':
        SpecificIcon = Info;
        break;
      case 'system_update':
        SpecificIcon = ServerCog;
        break;
      case 'info':
        SpecificIcon = Info;
        break;
      default:
        SpecificIcon = Bell;
    }
  }

  const iconColorClass =
    type === 'alert_trigger' ? 'text-accent' :
    type === 'system_update' ? 'text-orange-500' :
    type === 'site_message' ? 'text-blue-500' :
    type === 'info' ? 'text-sky-500' :
    'text-muted-foreground';

  return <SpecificIcon className={cn("h-5 w-5 mr-3 flex-shrink-0", iconColorClass)} />;
};


export default function NotificationsPage() {
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications,
    unreadCount 
  } = useNotificationCenter();

  return (
    <div className="container mx-auto py-8 space-y-12">
      <header className="text-center">
        <h1 className="text-4xl font-headline font-bold tracking-tight sm:text-5xl flex items-center justify-center">
          <Bell className="mr-3 h-10 w-10 text-accent"/>
          Notification <span className="text-accent">Center</span>
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
          Manage your recent notifications.
        </p>
      </header>
      
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="font-headline text-xl">Your Notifications</CardTitle>
            <CardDescription>
              {notifications.length > 0 
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}.`
                : "No notifications yet."}
            </CardDescription>
          </div>
          {notifications.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center sm:ml-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0} className="w-full sm:w-auto">
                <CheckCheck className="mr-2 h-4 w-4" /> Mark All Read
              </Button>
              <Button variant="destructive" size="sm" onClick={clearAllNotifications} className="w-full sm:w-auto">
                <Trash2 className="mr-2 h-4 w-4" /> Clear All
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <BellOff className="h-20 w-20 text-muted-foreground/50 mx-auto mb-6" />
              <p className="text-xl font-semibold text-muted-foreground mb-2">It's quiet in here...</p>
              <p className="text-muted-foreground">You have no notifications.</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-20rem)] max-h-[500px] pr-4">
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    id={notification.id} 
                    className={cn(
                      "p-4 rounded-lg flex items-start space-x-3 transition-colors duration-150",
                      notification.read 
                        ? "bg-card hover:bg-muted/40" 
                        : "bg-primary/5 hover:bg-primary/10 "
                    )}
                  >
                    <NotificationIcon type={notification.type} iconName={notification.iconName} />
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-0.5">
                        <h3 className={cn(
                          "font-semibold text-sm leading-tight",
                          !notification.read && "text-foreground"
                        )}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {formatDistanceToNow(parseISO(notification.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <p className={cn(
                        "text-xs mt-0.5",
                        notification.read ? "text-muted-foreground" : "text-foreground/90"
                      )}>
                        {notification.message}
                      </p>
                       {notification.relatedLink && (
                        <a 
                            href={notification.relatedLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-accent hover:text-accent/80 hover:underline mt-1.5 inline-block font-medium"
                        >
                            View Details
                        </a>
                       )}
                       <div className="mt-2.5 flex gap-1.5">
                        {!notification.read && (
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             onClick={() => markAsRead(notification.id)} 
                             className="text-xs h-auto py-0.5 px-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                           >
                            Mark as Read
                          </Button>
                        )}
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           onClick={() => deleteNotification(notification.id)} 
                           className="text-xs h-auto py-0.5 px-1.5 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                         >
                            Delete
                          </Button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// components/settings/notification-settings.tsx
import { useState } from 'react';
import { Switch, TouchableOpacity, Alert } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { View } from '@/components/ui/view';
import { Text } from '@/components/ui/text';
import { Bell, BellOff } from 'lucide-react-native';

export const NotificationSettings = () => {
  const preferences = useQuery(
    api.pushNotifications.getNotificationPreferences,
  );
  const updatePreferences = useMutation(
    api.pushNotifications.updateNotificationPreferences,
  );

  const [isEnabled, setIsEnabled] = useState(preferences?.enabled ?? true);

  const handleToggle = async (value: boolean) => {
    setIsEnabled(value);

    try {
      await updatePreferences({ enabled: value });

      Alert.alert(
        value ? 'Notifications Enabled' : 'Notifications Disabled',
        value
          ? 'You will now receive push notifications for post reactions and comments.'
          : 'You will no longer receive push notifications.',
      );
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      // Revert on error
      setIsEnabled(!value);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  if (preferences === undefined) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 20, gap: 16 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: '#fff',
          marginBottom: 8,
        }}
      >
        Push Notifications
      </Text>

      {/* Main toggle */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(255,255,255,0.05)',
          padding: 16,
          borderRadius: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {isEnabled ? (
            <Bell size={24} color='#FAD40B' />
          ) : (
            <BellOff size={24} color='rgba(255,255,255,0.3)' />
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
              Push Notifications
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.5)',
                marginTop: 2,
              }}
            >
              Get notified about reactions and comments
            </Text>
          </View>
        </View>

        <View>
          <Switch
            value={isEnabled}
            onValueChange={handleToggle}
            trackColor={{ false: '#767577', true: '#FAD40B' }}
            thumbColor={isEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>
    </View>
  );
};

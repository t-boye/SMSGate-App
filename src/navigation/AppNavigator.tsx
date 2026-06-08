import React, {useEffect} from 'react';
import {View, Text, StyleSheet, PermissionsAndroid, Platform} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Colors, Typography} from '../theme';
import HomeScreen from '../screens/HomeScreen';
import MessagesScreen from '../screens/MessagesScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Home:     '⌂',
  Messages: '✉',
  Settings: '⚙',
};

function TabIcon({name, focused}: {name: string; focused: boolean}) {
  return (
    <View style={styles.iconWrap}>
      <View style={[styles.iconBg, focused && styles.iconBgFocused]}>
        <Text style={[styles.icon, focused && styles.iconFocused]}>
          {TAB_ICONS[name]}
        </Text>
      </View>
    </View>
  );
}

const navTheme = {
  dark: true,
  colors: {
    primary: Colors.gold,
    background: Colors.bg,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.surfaceBorder,
    notification: Colors.gold,
  },
  fonts: {
    regular: {fontFamily: 'System', fontWeight: Typography.regular},
    medium: {fontFamily: 'System', fontWeight: Typography.medium},
    bold: {fontFamily: 'System', fontWeight: Typography.bold},
    heavy: {fontFamily: 'System', fontWeight: Typography.bold},
  },
};

async function requestAppPermissions() {
  if (Platform.OS !== 'android') return;

  const perms: string[] = [
    PermissionsAndroid.PERMISSIONS.SEND_SMS,
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
  ];

  // POST_NOTIFICATIONS is only a runtime permission on Android 13+
  if (Platform.Version >= 33) {
    perms.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }

  await PermissionsAndroid.requestMultiple(perms);
}

export default function AppNavigator() {
  useEffect(() => { requestAppPermissions(); }, []);

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({route}) => ({
          tabBarIcon: ({focused}) => (
            <TabIcon name={route.name} focused={focused} />
          ),
          tabBarLabel: ({focused}) => (
            <Text style={[styles.label, focused && styles.labelFocused]}>
              {route.name}
            </Text>
          ),
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabItem,
          headerShown: false,
        })}>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
        />
        <Tab.Screen
          name="Messages"
          component={MessagesScreen}
          options={{title: 'Messages'}}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{title: 'Settings'}}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.surfaceBorder,
    borderTopWidth: 1,
    height: 68,
    paddingBottom: 10,
    paddingTop: 6,
  },
  tabItem: {gap: 2},
  iconWrap: {alignItems: 'center'},
  iconBg: {
    width: 36, height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBgFocused: {
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  icon: {
    fontSize: 18,
    color: Colors.textMuted,
  },
  iconFocused: {color: Colors.gold},
  label: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    color: Colors.textMuted,
  },
  labelFocused: {color: Colors.gold},
});

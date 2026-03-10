import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Colors, Typography} from '../theme';
import HomeScreen from '../screens/HomeScreen';
import MessagesScreen from '../screens/MessagesScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Home: '◈',
  Messages: '⊠',
  Settings: '⊙',
};

function TabIcon({name, focused}: {name: string; focused: boolean}) {
  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>
        {TAB_ICONS[name]}
      </Text>
      {focused && <View style={styles.dot} />}
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

export default function AppNavigator() {
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
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
          headerTintColor: Colors.textPrimary,
          headerShadowVisible: false,
        })}>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{title: 'SMS Gateway'}}
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
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: {gap: 2},
  iconWrap: {alignItems: 'center', gap: 4},
  icon: {
    fontSize: 20,
    color: Colors.textMuted,
  },
  iconFocused: {color: Colors.gold},
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gold,
  },
  label: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    color: Colors.textMuted,
  },
  labelFocused: {color: Colors.gold},
  header: {backgroundColor: Colors.surface},
  headerTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
});

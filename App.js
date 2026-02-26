import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeDb, getSession } from './src/database/Store';
import { View, ActivityIndicator } from 'react-native';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    const prepare = async () => {
      await initializeDb();
      const session = await getSession();
      if (session) setInitialRoute('Main');
      setLoading(false);
    };
    prepare();
  }, []);

  if (loading) return <View style={{flex:1, justifyContent:'center'}}><ActivityIndicator size="large"/></View>;

  return (
    <NavigationContainer>
      <AppNavigator initialRoute={initialRoute} />
    </NavigationContainer>
  );
}
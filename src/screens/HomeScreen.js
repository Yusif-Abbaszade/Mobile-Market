import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { getSession, clearSession } from '../database/Mockdb';

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const sessionData = await getSession();
        if (sessionData) {
          setUser(JSON.parse(sessionData));
        }
      } catch (error) {
        console.error("Failed to load session", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await clearSession();
    navigation.replace('Login');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Welcome back,</Text>
        {/* We get the name directly from the state we set from AsyncStorage */}
        <Text style={styles.userName}>{user?.name || 'User'}!</Text>
        
        <View style={styles.card}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  label: { fontSize: 18, color: '#666' },
  userName: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 30 },
  card: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 15, 
    width: '100%', 
    elevation: 3, 
    marginBottom: 40,
    alignItems: 'center'
  },
  infoLabel: { fontSize: 14, color: '#999', textTransform: 'uppercase' },
  infoValue: { fontSize: 18, color: '#444', fontWeight: '500' },
  logoutBtn: { backgroundColor: '#FF3B30', paddingVertical: 15, paddingHorizontal: 60, borderRadius: 10 },
  logoutText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
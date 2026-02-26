import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, FlatList, Image } from 'react-native';
import { getSession, clearSession, getItems } from '../database/Store'; // Changed from Mockdb

export default function HomeScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProfileData = async () => {
    try {
      const sessionData = await getSession();
      if (sessionData) {
        const currentUser = JSON.parse(sessionData);
        setUser(currentUser);

        // Fetch all items from Supabase to filter
        const allItems = await getItems();
        
        // Items I am selling
        setMyItems(allItems.filter(item => item.seller_email === currentUser.email));
        
        // Items I have bought (assuming we want to show sold items where I'm the buyer)
        // Note: You may need a separate function in Store.js to get sold items for this
        setPurchasedItems(allItems.filter(item => item.buyer_email === currentUser.email));
      }
    } catch (error) {
      console.error("Failed to load profile data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadProfileData);
    return unsubscribe;
  }, [navigation]);

  const handleLogout = async () => {
    await clearSession();
    navigation.replace('Login');
  };

  const renderMiniCard = ({ item }) => (
    <View style={styles.miniCard}>
      <Image 
        source={item.image_url ? { uri: item.image_url } : require('../../assets/No_Image_Available.jpg')} 
        style={styles.miniImg} 
      />
      <Text style={styles.miniTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.miniPrice}>${item.price}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.profileCircle}>
              <Text style={styles.initials}>{user?.name?.charAt(0) || 'U'}</Text>
            </View>
            <Text style={styles.userName}>{user?.name}!</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
            
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>My active listings ({myItems.length})</Text>
          </View>
        }
        data={myItems}
        renderItem={renderMiniCard}
        keyExtractor={item => item.id.toString()}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.emptyText}>No active items.</Text>}
        contentContainerStyle={{ paddingLeft: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', padding: 20, marginTop: 20 },
  profileCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#007AFF', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 15
  },
  initials: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  userName: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  infoValue: { fontSize: 16, color: '#666', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', alignSelf: 'flex-start', marginTop: 20, color: '#333' },
  logoutBtn: { backgroundColor: '#FF3B3020', paddingVertical: 10, paddingHorizontal: 30, borderRadius: 20 },
  logoutText: { color: '#FF3B30', fontSize: 14, fontWeight: 'bold' },
  
  miniCard: { backgroundColor: '#fff', width: 140, marginRight: 15, borderRadius: 12, padding: 10, elevation: 2, marginVertical: 10 },
  miniImg: { width: '100%', height: 100, borderRadius: 8, marginBottom: 5 },
  miniTitle: { fontSize: 14, fontWeight: '600' },
  miniPrice: { fontSize: 14, color: '#28a745', fontWeight: 'bold' },
  emptyText: { color: '#999', marginTop: 10, fontStyle: 'italic' }
});
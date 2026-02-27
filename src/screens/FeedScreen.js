import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Image, Alert } from 'react-native';
import { buyItem, getItems, getSession } from '../database/Store';
import { supabase } from '../database/SupabaseClient';
import { ActivityIndicator } from 'react-native';

export default function FeedScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // Use focus listener to refresh data from Supabase
  useEffect(() => {

    const loadMarketplace = async () => {
      setLoading(true);
      try {
        // Fetch from 'listings' table as identified in your logs
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setItems(data || []);
      } catch (err) {
        console.error("Initial load error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    // 2. Run it immediately on mount
    loadMarketplace();






    const fetchInitialData = async () => {
      const { data } = await supabase.from('listings').select('*').order('created_at', { ascending: false });
      if (data) setItems(data);
    };
    fetchInitialData();


    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, and DELETE
          schema: 'public',
          table: 'listings',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setItems((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            // Remove the item from the UI immediately when it's deleted from DB
            setItems((prev) => prev.filter((item) => item.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setItems((prev) => prev.map((item) => item.id === payload.new.id ? payload.new : item));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const session = await getSession();
      if (session) setCurrentUser(JSON.parse(session));
    };
    loadUser();
  }, []);

  const openDetails = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handlePurchase = async () => {
    if (!selectedItem || !currentUser) return;

    if(selectedItem.is_sold) {
      Alert.alert("Unavailable", "This item has already been sold.");
      return;
    }

    // Supabase column name is 'seller_email'
    if (selectedItem.sellerEmail === currentUser.email) {
      Alert.alert("Action Denied", "You cannot buy your own item.");
      return;
    }

    try {
      // Passes the UUID/ID and buyer email to Supabase
      await buyItem(selectedItem.id, currentUser.email);
      Alert.alert("Success", "You have successfully bought this item!");
      setModalVisible(false);

      // Refresh list to reflect 'Sold Out' status
      const data = await getItems();
      setItems(data);
    } catch (error) {
      Alert.alert("Error", "Purchase failed. Please try again.");
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={{display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1}}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={item => item.id.toString()}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.gridCard} onPress={() => openDetails(item)}>
              <Image
                // Updated to use 'image_url' from Supabase
                source={item.image_url ? { uri: item.image_url } : require('../../assets/No_Image_Available.jpg')}
                style={styles.cardImg}
              />
              <View style={styles.cardInfo}>
                <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.sellerNameText} numberOfLines={1}>{item.sellerName}</Text>
                {/* Checks 'is_sold' boolean from database */}
                <Text style={item.is_sold ? styles.gridSoldPrice : styles.gridPrice} >
                  {item.is_sold ? "Sold Out" : `$${item.price}`}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}


      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Image
              source={selectedItem?.image_url ? { uri: selectedItem.image_url } : require('../../assets/No_Image_Available.jpg')}
              style={styles.modalImg}
            />
            <Text style={styles.modalTitle}>{selectedItem?.title}</Text>
            <Text style={styles.modalItemOwner} numberOfLines={1}>Listed by: {selectedItem?.sellerName}</Text>
            <Text style={styles.modalDescription}>{selectedItem?.description}</Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  styles.buyBtn,
                  (selectedItem?.sellerEmail === currentUser?.email || selectedItem?.is_sold) && styles.disabledBtn
                ]}
                onPress={handlePurchase}
                // disabled={selectedItem?.sellerEmail === currentUser?.email || selectedItem?.is_sold}
              >
                <Text style={styles.btnText}>
                  {selectedItem?.is_sold ? "Sold Out" : selectedItem?.sellerEmail === currentUser?.email ? "Your Item" : "Buy Now"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalBtn, styles.closeBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', padding: 5 },
  row: { justifyContent: 'space-between', paddingHorizontal: 10 },
  gridCard: {
    backgroundColor: '#fff',
    width: '48%',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 3,
  },
  cardImg: { width: '100%', height: 150, backgroundColor: '#eee' },
  cardInfo: { padding: 10 },
  gridTitle: { fontSize: 16, fontWeight: 'bold' },
  sellerNameText: { fontSize: 12, color: '#555' },
  gridPrice: { color: '#28a745', fontWeight: 'bold', marginTop: 5 },
  gridSoldPrice: { color: 'red', fontWeight: 'bold', marginTop: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalView: { width: '90%', backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', paddingBottom: 20 },
  modalImg: { width: '100%', height: 250 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', paddingHorizontal: 15, marginTop: 15, marginBottom: 10 },
  modalItemOwner: { paddingHorizontal: 15, fontStyle: 'italic', color: '#555', marginBottom: 4 },
  modalDescription: { paddingHorizontal: 15, color: '#666', marginBottom: 10 },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 20,
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtn: { backgroundColor: '#28a745' },
  closeBtn: { backgroundColor: '#666' },
  disabledBtn: { backgroundColor: '#ccc' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
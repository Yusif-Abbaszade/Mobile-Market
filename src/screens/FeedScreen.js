import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Button, Image, Alert } from 'react-native';
import { buyItem, getItems, getSession } from '../database/Store';

export default function FeedScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null); // Track which item to show
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      setItems(await getItems());
    });
    return unsubscribe;
  }, [navigation]);

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

    // Logic: Prevent user from buying their own item
    if (selectedItem.sellerEmail === currentUser.email) {
      Alert.alert("Action Denied", "You cannot buy your own item.");
      return;
    }

    await buyItem(selectedItem.id, currentUser.email);
    // Alert("Success", "You have successfully bought this item!");
    Alert.alert("Success", "You have successfully bought this item!");
    setModalVisible(false);
    // Refresh the list
    const data = await getItems();
    setItems(data);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        numColumns={2} // Grid Layout
        keyExtractor={item => item.id.toString()}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.gridCard} onPress={() => openDetails(item)}>
            <Image
              source={item.image ? { uri: item.image } : require('../../assets/No_Image_Available.jpg')}
              style={styles.cardImg}
            />
            <View style={styles.cardInfo}>
              <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.sellerNameText} numberOfLines={1}>{item.sellerName}</Text>
              <Text style={item.isSold ? styles.gridSoldPrice :styles.gridPrice} >{item.isSold?"Sold Out":`$${item.price}`}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Update Modal to show the image too */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Image source={selectedItem?.image ? { uri: selectedItem.image } : require('../../assets/No_Image_Available.jpg')} style={styles.modalImg} />
            <Text style={styles.modalTitle}>{selectedItem?.title}</Text>
            <Text style={styles.modalItemOwner} numberOfLines={1}>{selectedItem?.sellerName}</Text>
            <Text style={styles.modalDescription}>{selectedItem?.description}</Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  styles.buyBtn,
                  (selectedItem?.sellerEmail === currentUser?.email || selectedItem?.isSold) && styles.disabledBtn
                ]}
                onPress={handlePurchase}
                disabled={selectedItem?.sellerEmail === currentUser?.email || selectedItem?.isSold}
              >
                <Text style={styles.btnText}>
                  {selectedItem?.isSold ? "Sold Out" : selectedItem?.sellerEmail === currentUser?.email ? "Your Item" : "Buy Now"}
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
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  cardImg: { width: '100%', height: 150 },
  cardInfo: { padding: 10 },
  gridTitle: { fontSize: 16, fontWeight: 'bold' },
  sellerNameText: { fontSize: 12, color: '#555' },
  gridPrice: { color: '#28a745', fontWeight: 'bold', marginTop: 5 },
  gridSoldPrice: { color: 'red', fontWeight: 'bold', marginTop: 5 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalView: { width: '90%', backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', paddingBottom: 20 },
  modalImg: { width: '100%', height: 250 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', paddingHorizontal: 15, marginTop: 15, marginBottom: 10 },
  modalItemOwner: { paddingHorizontal: 15, fontStyle: 'italic', color: '#555', marginBottom: 4 },
  modalDescription: { paddingHorizontal: 15, color: '#666', marginBottom: 10 },
  buttonRow: {
    flexDirection: 'row', // This puts buttons side-by-side
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 20,
    gap: 10, // Adds space between the buttons
  },
  modalBtn: {
    flex: 1, // Ensures both buttons take up equal width
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtn: {
    backgroundColor: '#28a745',
  },
  closeBtn: {
    backgroundColor: '#666',
  },
  disabledBtn: {
    backgroundColor: '#ccc',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
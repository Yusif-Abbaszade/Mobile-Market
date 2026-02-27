import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { getItems, getSession, deleteItem, clearSession } from '../database/Store';

export default function ProfileScreen({ navigation }) {
    const [myItems, setMyItems] = useState([]);
    const [purchasedItems, setPurchasedItems] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const sessionStr = await getSession();
            if (!sessionStr) return;
            
            const currentUser = JSON.parse(sessionStr);
            setUser(currentUser);

            // Fetch all items from Supabase
            const allItems = await getItems();

            // Filter using Supabase column names: 'seller_email' and 'buyer_email'
            setMyItems(allItems.filter(i => i.sellerEmail === currentUser.email));
            setPurchasedItems(allItems.filter(i => i.buyerEmail === currentUser.email && i.is_sold));
        } catch (error) {
            console.error("Failed to load profile data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsub = navigation.addListener('focus', loadData);
        return unsub;
    }, [navigation]);

    const handleRemove = async (id) => {
        Alert.alert(
            "Delete Listing",
            "Are you sure you want to remove this item?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        await deleteItem(id); // Deletes from Supabase
                        loadData(); // Refresh list
                    } 
                }
            ]
        );
    };

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
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.email}>{user?.email}</Text>
                <TouchableOpacity style={styles.logout} onPress={handleLogout}>
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Logout</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.title}>My Listings</Text>
            {myItems.length === 0 ? (
                <Text style={styles.emptyText}>You have no active listings.</Text>
            ) : (
                <FlatList 
                    data={myItems} 
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View>
                                <Text style={styles.itemTitle}>{item.title}</Text>
                                <Text style={item.is_sold ? styles.soldText : styles.activeText}>
                                    {item.is_sold ? "Sold" : "Active"}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => handleRemove(item.id)}>
                                <Text style={{ color: 'red', fontWeight: 'bold' }}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    )} 
                />
            )}

            <Text style={styles.title}>Purchased Items</Text>
            {purchasedItems.length === 0 ? (
                <Text style={styles.emptyText}>You haven't bought anything yet.</Text>
            ) : (
                <FlatList
                    data={purchasedItems}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.purchasedCard}>
                            <Text style={styles.itemTitle}>{item.title}</Text>
                            <Text style={styles.status}>Bought for ${item.price}</Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { marginBottom: 30, marginTop: 20 },
    name: { fontSize: 28, fontWeight: 'bold', color: '#333' },
    email: { color: '#666', fontSize: 16, marginBottom: 15 },
    logout: { backgroundColor: '#FF3B30', padding: 10, borderRadius: 8, width: 100, alignItems: 'center' },
    title: { fontSize: 22, fontWeight: 'bold', marginTop: 20, borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 20, color: '#333' },
    card: { padding: 15, backgroundColor: '#fff', marginTop: 10, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
    purchasedCard: { padding: 15, backgroundColor: '#fff', marginTop: 10, borderRadius: 10, elevation: 2 },
    itemTitle: { fontSize: 18, fontWeight: 'bold', color: '#444' },
    status: { color: '#28a745', marginTop: 5, fontWeight: '500' },
    soldText: { color: '#dc3545', fontSize: 12, fontWeight: 'bold' },
    activeText: { color: '#28a745', fontSize: 12, fontWeight: 'bold' },
    emptyText: { color: 'gray', textAlign: 'center', marginTop: 20, fontSize: 16, fontStyle: 'italic' }
});
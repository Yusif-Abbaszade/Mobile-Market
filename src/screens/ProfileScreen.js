import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { getItems, getSession, deleteItem, clearSession } from '../database/Store';

export default function ProfileScreen({ navigation }) {
    const [myItems, setMyItems] = useState([]);
    const [user, setUser] = useState(null);

    const [purchasedItems, setPurchasedItems] = useState([]);

    const load = async () => {
        const s = JSON.parse(await getSession());
        setUser(s);
        const all = await getItems();
        setMyItems(all.filter(i => i.sellerEmail === s.email));

        const userData = s;
        setUser(userData);

        const allItems = await getItems();
        // Filter items the user has listed
        setMyItems(allItems.filter(i => i.sellerEmail === userData.email));
        // Filter items the user has BOUGHT
        setPurchasedItems(allItems.filter(i => i.buyerEmail === userData.email && i.isSold));

    };

    useEffect(() => {
        const unsub = navigation.addListener('focus', load);
        return unsub;
    }, [navigation]);

    const remove = async (id) => {
        await deleteItem(id);
        load();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <TouchableOpacity style={styles.logout} onPress={() => clearSession().then(() => navigation.replace('Login'))}>
                <Text style={{ color: 'white' }}>Logout</Text>
            </TouchableOpacity>

            <Text style={styles.title}>My Listings</Text>
            {myItems.length === 0 ? (
                <Text style={{ color: 'gray', textAlign: 'center', marginTop: 20, fontSize: 20 }}>You have no active listings.</Text>
            ) :
                <FlatList data={myItems} renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={{ fontWeight: "bold" }}>{item.title}</Text>
                        <Text style={{ color: "green" }}>{item.isSold ? "Sold Out" : ""}</Text>
                        <TouchableOpacity onPress={() => remove(item.id)}><Text style={{ color: 'red' }}>Delete</Text></TouchableOpacity>
                    </View>
                )} />
            }

            <Text style={styles.sectionTitle}>Purchased Items</Text>
            {purchasedItems.length === 0 ? (
                <Text style={{ color: 'gray', textAlign: 'center', marginTop: 20, fontSize: 20 }}>You haven't bought anything yet.</Text>
            ) : (
                <FlatList
                    data={purchasedItems}
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
    container: { flex: 1, padding: 20, gap: 10 },
    name: { fontSize: 24, fontWeight: 'bold', marginTop: 20 },
    email: { color: '#666', marginBottom: 10 },
    logout: { backgroundColor: 'red', padding: 10, borderRadius: 5, width: 80, alignItems: 'center', marginBottom: 50 },
    title: { fontSize: 30, fontWeight: 'bold', borderTopWidth: 1, paddingTop: 30, },
    card: { padding: 15, backgroundColor: '#eee', marginTop: 10, borderRadius: 5, flexDirection: 'row', justifyContent: 'space-between' },
    sectionTitle: { fontSize: 30, fontWeight: 'bold', borderTopWidth: 1, paddingTop: 30, },
    purchasedCard: { padding: 15, backgroundColor: '#eee', marginTop: 10, borderRadius: 5 },
    itemTitle: { fontSize: 18, fontWeight: 'bold' },
    status: { color: '#28a745', marginTop: 5 }
});
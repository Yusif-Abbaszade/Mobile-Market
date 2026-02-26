import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
// Import uploadImage from your store
import { addItem, getSession, uploadImage } from '../database/Store'; 

export default function AddItemScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false); // New loading state for UX

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, 
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    // 1. Basic Validation
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid numeric price.");
      return;
    }

    if (!title || !description || !image) {
      Alert.alert("Missing Info", "Please fill in all fields and add a photo.");
      return;
    }

    try {
      setIsUploading(true); // Start loading spinner

      // 2. Get User Session
      const sessionStr = await getSession();
      const session = JSON.parse(sessionStr);

      // 3. Upload image to Supabase Storage and get the Public URL
      const publicImageUrl = await uploadImage(image);
      console.log(publicImageUrl);

      if (!publicImageUrl) {
        throw new Error("Image upload failed");
      }

      // 4. Prepare the new item object for the Cloud Database
      const newItem = {
        title,
        price: numericPrice.toFixed(2),
        description,
        image_url: publicImageUrl, // Save the cloud URL, not the local URI
        sellerEmail: session.email,
        sellerName: session.name
      };

      // 5. Save to Supabase 'items' table
      await addItem(newItem);
      
      Alert.alert("Success", "Listing is live on the cloud!");
      navigation.navigate('Marketplace');
    } catch (error) {
      console.error(error);
      Alert.alert("Upload Error", "Could not post your item. Check your connection.");
    } finally {
      setIsUploading(false); // Stop loading spinner
      setTitle('');
      setPrice('');
      setDescription('');
      setImage(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage} disabled={isUploading}>
        {image ? <Image source={{ uri: image }} style={styles.fullImage} /> : <Text>+ Add Photo</Text>}
      </TouchableOpacity>

      <TextInput 
        placeholder="Item Title" 
        style={styles.input} 
        onChangeText={setTitle} 
        editable={!isUploading} 
      />
      
      <TextInput 
        placeholder="Price" 
        style={styles.input} 
        value={price} 
        keyboardType="numeric" 
        onChangeText={(text) => setPrice(text.replace(/[^0-9.]/g, ''))} 
        editable={!isUploading}
      />
      
      <TextInput 
        placeholder="Description" 
        style={[styles.input, { height: 80 }]} 
        multiline 
        onChangeText={setDescription} 
        editable={!isUploading}
      />

      <TouchableOpacity 
        style={[styles.btn, isUploading && { backgroundColor: '#ccc' }]} 
        onPress={handlePost} 
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Post Listing</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  imagePlaceholder: { width: '100%', height: 200, backgroundColor: '#eee', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#ddd' },
  fullImage: { width: '100%', height: '100%' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  btn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', height: 50, justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
// import React, { useState } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
// import { addItem, getSession } from '../database/Store';

// export default function AddItemScreen({ navigation }) {
//   const [title, setTitle] = useState('');
//   const [price, setPrice] = useState('');
//   const [description, setDescription] = useState('');

//   const handlePost = async () => {
//     const session = JSON.parse(await getSession());
//     const newItem = { id: Date.now(), title, price, description, sellerEmail: session.email, sellerName: session.name };
//     await addItem(newItem);
//     Alert.alert("Success", "Listing Live!");
//     navigation.navigate('Marketplace');
//   };

//   return (
//     <View style={styles.container}>
//       <TextInput placeholder="Item Title" style={styles.input} onChangeText={setTitle} />
//       <TextInput placeholder="Price" style={styles.input} keyboardType="numeric" onChangeText={setPrice} />
//       <TextInput
//         placeholder="Description (e.g. Slightly used, 2023 edition)"
//         style={[styles.input, { height: 100 }]}
//         multiline
//         onChangeText={setDescription}
//       />
//       <TouchableOpacity style={styles.btn} onPress={handlePost}><Text style={styles.btnText}>Post Now</Text></TouchableOpacity>
//     </View>
//   );
// }
// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 20, justifyContent: 'center' },
//   input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
//   btn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
//   btnText: { color: '#fff', fontWeight: 'bold' }
// });

//New version with image upload and better styling


import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { addItem, getSession } from '../database/Store';

export default function AddItemScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Lower quality to save space in AsyncStorage
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    const sessionStr = await getSession();
    const session = JSON.parse(sessionStr);

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid numeric price (e.g., 10.50)");
      return;
    }

    if (!title || !description) {
    Alert.alert("Missing Info", "Please fill in all fields");
    return;
  }

    const newItem = {
      id: Date.now(),
      title,
      price : numericPrice.toFixed(2), // Ensure price is stored as a string with 2 decimals
      description,
      image, // Saving the image URI
      sellerEmail: session.email,
      sellerName: session.name
    };

    await addItem(newItem);
    navigation.navigate('Marketplace');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
        {image ? <Image source={{ uri: image }} style={styles.fullImage} /> : <Text>+ Add Photo</Text>}
      </TouchableOpacity>

      <TextInput placeholder="Item Title" style={styles.input} onChangeText={setTitle} />
      <TextInput placeholder="Price" style={styles.input} value={price} keyboardType="numeric" onChangeText={(text)=>{setPrice(text.replace(/[^0-9.]/g, ''))}} />
      <TextInput placeholder="Description" style={[styles.input, { height: 80 }]}  multiline onChangeText={setDescription} />

      <TouchableOpacity style={styles.btn} onPress={handlePost}>
        <Text style={styles.btnText}>Post Listing</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  imagePlaceholder: { width: '100%', height: 200, backgroundColor: '#aaa', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  fullImage: { width: '100%', height: '100%' },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  btn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
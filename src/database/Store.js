// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Alert } from 'react-native';
// import { supabase } from './SupabaseClient';
// import { decode } from 'base64-arraybuffer';
// import * as FileSystem from 'expo-file-system';

// const KEYS = { USERS: '@users', ITEMS: '@listings', SESSION: '@session' };

// // Initialize Admin if no users exist
// export const initializeDb = async () => {
//   const existingUsers = await AsyncStorage.getItem(KEYS.USERS);
//   if (!existingUsers) {
//     const admin = [{ email: 'admin@test.com', password: '123', name: 'Admin User' }];
//     await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(admin));
//   }
// };

// export const getUsers = async () => {
//   const data = await AsyncStorage.getItem(KEYS.USERS);
//   return data ? JSON.parse(data) : [];
// };

// export const saveUser = async (user) => {
//   const users = await getUsers();
//   users.push(user);
//   await AsyncStorage.setItem(KEYS.USERS, JSON.stringify(users));
// };

// export const getItems = async () => {
//   const data = await AsyncStorage.getItem(KEYS.ITEMS);
//   return data ? JSON.parse(data) : [];
// };

// export const addItem = async (item) => {
//   const items = await getItems();
//   items.unshift(item);
//   await AsyncStorage.setItem(KEYS.ITEMS, JSON.stringify(items));
// };

// export const deleteItem = async (id) => {
//   const items = await getItems();
//   const filtered = items.filter(i => i.id !== id);
//   await AsyncStorage.setItem(KEYS.ITEMS, JSON.stringify(filtered));
// };

// export const buyItem = async (itemId, buyerEmail) => {
//   const items = await getItems();
//   const updatedItems = items.map(item => {
//     if (item.id === itemId) {
//       return { ...item, isSold: true, buyerEmail: buyerEmail };
//     }
//     return item;
//   });
//   await AsyncStorage.setItem(KEYS.ITEMS, JSON.stringify(updatedItems));
// };



// export const uploadImage = async (uri) => {
//   try {
//     // 1. Convert image to base64
//     const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
//     const fileName = `public/${Date.now()}.jpg`;
//     const contentType = 'image/jpeg';

//     // 2. Upload to Supabase Storage bucket 'item-images'
//     const { data, error } = await supabase.storage
//       .from('itemimgs')
//       .upload(fileName, decode(base64), { contentType });

//     if (error) throw error;

//     // 3. Get the Public URL
//     const { data: urlData } = supabase.storage
//       .from('itemimgs')
//       .getPublicUrl(fileName);

//     return urlData.publicUrl;
//   } catch (err) {
//     console.error("Upload error:", err);
//     return null;
//   }
// };





// export const setSession = (user) => AsyncStorage.setItem(KEYS.SESSION, JSON.stringify(user));
// export const getSession = () => AsyncStorage.getItem(KEYS.SESSION);
// export const clearSession = () => AsyncStorage.removeItem(KEYS.SESSION);



// --- REFACTORED VERSION WITH CLOUD INTEGRATION ---


import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './SupabaseClient';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';

const KEYS = { SESSION: '@session' };

// --- USER LOGIC (Cloud) ---

// Fetches all users from Supabase 'users' table
export const getUsers = async () => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    console.error("Error fetching users:", error.message);
    return [];
  }
  return data;
};

// Saves a new user to the cloud instead of local storage
export const saveUser = async (user) => {
  const { error } = await supabase.from('users').insert([user]);
  if (error) throw error;
};

// --- ITEM LOGIC (Cloud) ---

// Fetches available items directly from Supabase
export const getItems = async () => {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching items:", error.message);
    return [];
  }
  return data;
};

// Adds item to Supabase and handles the property mapping
export const addItem = async (item) => {

  const image_url = item.image ? await uploadImage(item.image) : null;

  const { error } = await supabase.from('items').insert([
    {
      title: item.title,
      price: item.price,
      description: item.description,
      image_url: image_url,
      seller_name: item.sellerName,
      seller_email: item.sellerEmail,
      is_sold: false
    }
  ]);
  if (error) throw error;
};

// Updates the 'is_sold' status and buyer email in the cloud
export const buyItem = async (itemId, buyerEmail) => {
  const { error } = await supabase
    .from('items')
    .update({ is_sold: true, buyer_email: buyerEmail })
    .eq('id', itemId);
  
  if (error) throw error;
};

// Deletes the specific item from the cloud table
export const deleteItem = async (id) => {
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw error;
};

// --- IMAGE LOGIC (Cloud Storage) ---

export const uploadImage = async (uri) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const fileName = `public/${Date.now()}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('itemimgs')
      .upload(fileName, decode(base64), { contentType: 'image/jpeg' });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('itemimgs')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (err) {
    console.error("Upload error:", err);
    return null;
  }
};

// --- SESSION LOGIC (Local) ---
// Kept local so the user stays logged in on their specific device
export const setSession = (user) => AsyncStorage.setItem(KEYS.SESSION, JSON.stringify(user));
export const getSession = () => AsyncStorage.getItem(KEYS.SESSION);
export const clearSession = () => AsyncStorage.removeItem(KEYS.SESSION);
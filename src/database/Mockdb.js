import AsyncStorage from '@react-native-async-storage/async-storage';

const USERS_KEY = '@users_data';
const LOGGED_IN_USER = '@logged_in_user';

export const initializeDb = async () => {
  const existingUsers = await AsyncStorage.getItem(USERS_KEY);
  if (!existingUsers) {
    const defaultAdmin = [{ email: 'admin@test.com', password: '123', name: 'Admin' }];
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(defaultAdmin));
  }
};

export const getUsers = async () => {
  const data = await AsyncStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveUser = async (newUser) => {
  const users = await getUsers();
  users.push(newUser);
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Persistent Login Helpers
export const setSession = (user) => AsyncStorage.setItem(LOGGED_IN_USER, JSON.stringify(user));
export const getSession = () => AsyncStorage.getItem(LOGGED_IN_USER);
export const clearSession = () => AsyncStorage.removeItem(LOGGED_IN_USER);
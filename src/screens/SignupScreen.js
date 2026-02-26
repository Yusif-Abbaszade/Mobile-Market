import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { supabase } from '../database/SupabaseClient'; // Direct import for query
import { saveUser } from '../database/Store';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    // 1. Basic Validation
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Security', 'Password should be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // 2. Check if email already exists in Supabase
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .single();
      
      if (existingUser) {
        Alert.alert('Error', 'An account with this email already exists');
        setLoading(false);
        return;
      }

      // 3. Save to Supabase 'users' table
      const newUser = { 
        name, 
        email: email.toLowerCase().trim(), 
        password // Note: Real apps use Supabase Auth for encryption
      };
      
      const { error } = await supabase.from('users').insert([newUser]);

      if (error) throw error;

      Alert.alert(
        'Success', 
        'Account created successfully!',
        [{ text: 'Login Now', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not create account. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Create Account</Text>
        
        <TextInput 
          placeholder="Full Name" 
          style={styles.input} 
          value={name}
          onChangeText={setName}
          editable={!loading}
        />
        
        <TextInput 
          placeholder="Email Address" 
          style={styles.input} 
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />
        
        <TextInput 
          placeholder="Password" 
          style={styles.input} 
          value={password}
          onChangeText={setPassword}
          secureTextEntry 
          editable={!loading}
        />

        <TouchableOpacity 
          style={[styles.button, loading && { backgroundColor: '#ccc' }]} 
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.link} 
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
        >
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.bold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  form: { flex: 1, justifyContent: 'center', paddingHorizontal: 25 },
  title: { fontSize: 30, fontWeight: 'bold', color: '#333', marginBottom: 30, textAlign: 'center' },
  input: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  button: { backgroundColor: '#28a745', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, height: 55, justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#666', fontSize: 14 },
  bold: { color: '#007AFF', fontWeight: 'bold' },
});
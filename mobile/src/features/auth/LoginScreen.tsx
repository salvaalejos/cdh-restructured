import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useAuthStore } from './store';
import { apiClient } from '../../api/client';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const login = useAuthStore(state => state.login);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Por favor, ingresa tu usuario y contraseña.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { username, password });
      
      // Axios devuelve el JSON dentro de 'data'
      const { token, user } = response.data;
      
      await login(token, user);
      
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background justify-center px-8">
      <View className="items-center mb-10">
        <Image 
          source={require('../../../assets/VERTICAL.png')} 
          style={{ width: 280, height: 280 }}
          resizeMode="contain"
        />
      </View>

      <View className="bg-card p-6 rounded-2xl shadow-sm border border-border">
        {error ? (
          <View className="bg-red-50 p-3 rounded-lg mb-4">
            <Text className="text-danger text-sm text-center">{error}</Text>
          </View>
        ) : null}

        <View className="mb-4">
          <Text className="text-foreground font-semibold mb-2">Usuario</Text>
          <TextInput
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground"
            placeholder="Ej. juan.perez"
            placeholderTextColor="#94a3b8"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View className="mb-6">
          <Text className="text-foreground font-semibold mb-2">Contraseña</Text>
          <TextInput
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground"
            placeholder="••••••••"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity 
          className="w-full bg-accent py-4 rounded-xl items-center flex-row justify-center"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
          ) : null}
          <Text className="text-white font-bold text-lg">
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

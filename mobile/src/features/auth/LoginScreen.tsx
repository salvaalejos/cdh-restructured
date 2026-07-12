import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { WifiOff, User, Lock, Eye, EyeOff, Copyright } from 'lucide-react-native';
import { useAuthStore } from './store';
import { apiClient } from '../../api/client';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

      <View className="bg-elevated p-6 rounded-2xl border border-border">
        {error ? (
          <View className={`p-3 rounded-lg mb-4 flex-row items-center justify-center gap-2 ${
            error === 'Conéctate a la red'
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            {error === 'Conéctate a la red' && <WifiOff size={16} color="#D97706" />}
            <Text className={`text-sm text-center font-medium ${
              error === 'Conéctate a la red' ? 'text-amber-700' : 'text-red-600'
            }`}>{error}</Text>
          </View>
        ) : null}

        <View className="mb-4">
          <Text className="text-foreground font-semibold mb-2">Usuario</Text>
          <View className="flex-row items-center bg-background border border-border rounded-xl px-3">
            <User size={18} color="#64748B" />
            <TextInput
              className="flex-1 text-foreground py-3 px-3"
              placeholder="Ej. juan.perez"
              placeholderTextColor="#94a3b8"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-foreground font-semibold mb-2">Contraseña</Text>
          <View className="flex-row items-center bg-background border border-border rounded-xl px-3">
            <Lock size={18} color="#64748B" />
            <TextInput
              className="flex-1 text-foreground py-3 px-3"
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              {showPassword ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          className="w-full bg-primary py-4 rounded-xl items-center flex-row justify-center active:opacity-80"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#F8FAFC" style={{ marginRight: 8 }} />
          ) : null}
          <Text className="text-white font-bold text-lg">
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-center mt-8">
        <Copyright size={12} color="#64748B" style={{ marginRight: 4 }} />
        <Text className="text-muted-foreground text-center text-xs">
          {new Date().getFullYear()} Caballo de Hierro
        </Text>
      </View>
    </View>
  );
}

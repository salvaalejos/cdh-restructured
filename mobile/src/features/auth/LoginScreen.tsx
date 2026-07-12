import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { WifiOff, User, Lock, Eye, EyeOff } from 'lucide-react-native';
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
          style={{ width: 200, height: 200 }}
          resizeMode="contain"
        />
      </View>

      <View className="bg-elevated p-6 rounded-2xl shadow-sm border border-border">
        <View className="items-center mb-6">
          <Text className="text-foreground text-2xl font-bold text-center">Acceso al Sistema</Text>
          <Text className="text-muted-foreground text-sm text-center mt-1">
            Ingresa tus credenciales para acceder
          </Text>
        </View>

        {error ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: error === 'Conéctate a la red' ? 'rgba(217,119,6,0.15)' : 'rgba(239,68,68,0.15)',
                borderColor: error === 'Conéctate a la red' ? 'rgba(217,119,6,0.3)' : 'rgba(239,68,68,0.3)',
              },
            ]}
          >
            {error === 'Conéctate a la red' && <WifiOff size={16} color="#FBBF24" />}
            <Text style={{
              fontSize: 14,
              textAlign: 'center',
              fontWeight: '500',
              color: error === 'Conéctate a la red' ? '#FBBF24' : '#FCA5A5',
            }}>{error}</Text>
          </View>
        ) : null}

        <View className="mb-4">
          <Text className="text-foreground font-semibold mb-2">Usuario</Text>
          <View className="flex-row items-center bg-background border border-border rounded-xl px-3">
            <User size={18} color="#64748B" />
            <TextInput
              className="flex-1 text-foreground py-3 px-3"
              placeholder="Ej. juan.perez"
              placeholderTextColor="#64748B"
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
              placeholderTextColor="#64748B"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              {showPassword ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
            </Pressable>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.loginButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
          ) : null}
          <Text className="text-primary-foreground font-bold text-lg">
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </Text>
        </Pressable>
      </View>

      <Text className="text-muted-foreground text-center text-xs mt-8">
        CDH 2026 — Comisión de Derechos Humanos
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

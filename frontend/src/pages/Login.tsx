import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ModeToggle } from '@/components/mode-toggle'
import { User, Lock, Eye, EyeOff } from 'lucide-react'
import LogoVertical from '@/logos/VERTICAL.png'
import axios from 'axios'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        username,
        password
      })

      if (response.data.token) {
        login(response.data.token, response.data.user)
        navigate('/admin')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ocurrió un error al iniciar sesión.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="flex justify-center items-center w-full mb-8">
          <img src={LogoVertical} alt="CDH Logo" className="h-36 w-auto object-contain mx-auto" />
        </div>

        <Card className="bg-card border border-border shadow-[0_2px_24px_rgba(0,0,0,0.06)]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-foreground text-center">Acceso al Sistema</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Ingresa tus credenciales para acceder a la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">Usuario</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="ej. administrador"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="bg-card text-foreground focus-visible:ring-primary pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-card text-foreground focus-visible:ring-primary pl-10 pr-10"
                  />
                  {password.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all duration-200 ease-out hover:scale-110 active:scale-95"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword
                        ? <EyeOff className="h-4 w-4 animate-in fade-in duration-150" />
                        : <Eye className="h-4 w-4 animate-in fade-in duration-150" />
                      }
                    </button>
                  )}
                </div>
              </div>
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive font-medium text-center">{error}</p>
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
                disabled={isLoading}
              >
                {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-xs text-muted-foreground text-center mt-4">
              &copy; {new Date().getFullYear()} Caballo de Hierro
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

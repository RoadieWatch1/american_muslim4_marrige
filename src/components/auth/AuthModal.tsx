import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, CheckCircle, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { TwoFactorModal } from './TwoFactorModal';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'auth' | 'verify' | 'success'>('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<{ userId: string; phoneNumber: string } | null>(null);
  const { signUp, signIn, sendVerificationCode, verifyEmailCode } = useAuth();
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const result = await signUp(email, password);
      if (result?.user) {
        setUserId(result.user.id);
        setIsNewUser(true);
        
        // Send verification code
        await sendVerificationCode(email, result.user.id);
        setMode('verify');
      }
    } catch (err: any) {
      if (err.message?.includes('User already registered')) {
        setError('An account with this email already exists. Please sign in.');
      } else {
        setError(err.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      setMode('success');
      setTimeout(() => {
        onClose();
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password');
      } else {
        setError(err.message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const verified = await verifyEmailCode(userId, verificationCode);
      if (verified) {
        setMode('success');
        setTimeout(() => {
          onClose();
          navigate('/onboarding');
        }, 2000);
      } else {
        setError('Invalid or expired verification code');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    try {
      await sendVerificationCode(email, userId);
      setError(''); // Clear any errors
      alert('Verification code sent to your email');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMode('auth');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setVerificationCode('');
    setError('');
    setIsNewUser(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-teal-800">
              {mode === 'auth' ? 'Welcome to Nikah Connect' : 
               mode === 'verify' ? 'Verify Your Email' : 'Success!'}
            </DialogTitle>
          </DialogHeader>
          
          {mode === 'auth' ? (
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email">Email Address</Label>
                    <Input 
                      id="signin-email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="your.email@example.com"
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input 
                        id="signin-password" 
                        type={showPassword ? "text" : "password"}
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-teal-600 hover:text-teal-700 underline w-full text-center"
                  >
                    Forgot Password?
                  </button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-email">Email Address</Label>
                    <Input 
                      id="signup-email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="your.email@example.com"
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input 
                        id="signup-password" 
                        type={showPassword ? "text" : "password"}
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="At least 6 characters"
                        required 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input 
                      id="confirm-password" 
                      type="password"
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      required 
                    />
                  </div>
                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Sign Up'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          ) : mode === 'verify' ? (
            <div className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50">
                <Mail className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  We've sent a 6-digit verification code to <strong>{email}</strong>
                </AlertDescription>
              </Alert>
              
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <Label htmlFor="code">Verification Code</Label>
                  <Input 
                    id="code" 
                    type="text"
                    value={verificationCode} 
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                    required 
                  />
                </div>
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify Email'}
                </Button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-sm text-teal-600 hover:text-teal-700 underline w-full text-center"
                >
                  Resend Code
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isNewUser ? 'Account Created!' : 'Welcome Back!'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isNewUser ? 
                    'Your email has been verified. Redirecting to complete your profile...' : 
                    'You have been signed in successfully.'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />

      {twoFactorData && (
        <TwoFactorModal
          isOpen={show2FA}
          onClose={() => setShow2FA(false)}
          userId={twoFactorData.userId}
          phoneNumber={twoFactorData.phoneNumber}
          onSuccess={() => {
            setShow2FA(false);
            setMode('success');
            setTimeout(() => onClose(), 2000);
          }}
        />
      )}
    </>
  );
};
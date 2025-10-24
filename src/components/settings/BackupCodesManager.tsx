import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Key, Download, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const BackupCodesManager: React.FC = () => {
  const { user } = useAuth();
  const [codes, setCodes] = useState<string[]>([]);
  const [remainingCount, setRemainingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCodes, setShowCodes] = useState(false);

  useEffect(() => {
    loadRemainingCount();
  }, [user]);

  const loadRemainingCount = async () => {
    if (!user) return;
    const { count } = await supabase
      .from('backup_codes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('used', false);
    setRemainingCount(count || 0);
  };

  const generateCodes = (): string[] => {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  const hashCode = async (code: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const newCodes = generateCodes();
      const hashedCodes = await Promise.all(newCodes.map(hashCode));
      
      await supabase.from('backup_codes').delete().eq('user_id', user?.id);
      
      const { error: insertError } = await supabase.from('backup_codes').insert(
        hashedCodes.map(hash => ({ user_id: user?.id, code_hash: hash }))
      );
      
      if (insertError) throw insertError;
      
      setCodes(newCodes);
      setShowCodes(true);
      setRemainingCount(10);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const text = `Backup Recovery Codes\n\n${codes.join('\n')}\n\nKeep these codes safe!`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-teal-600" />
          <CardTitle>Backup Recovery Codes</CardTitle>
        </div>
        <CardDescription>
          Use these codes if you lose access to your phone
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {remainingCount > 0 && !showCodes && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">{remainingCount} unused codes remaining</span>
          </div>
        )}
        
        {showCodes && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg font-mono text-sm">
              {codes.map((code, i) => (
                <div key={i} className="p-2 bg-white rounded border">{code}</div>
              ))}
            </div>
            <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>Save these codes now! Each can only be used once.</span>
            </div>
            <Button onClick={handleDownload} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Codes
            </Button>
          </div>
        )}
        
        {error && <p className="text-sm text-red-600">{error}</p>}
        
        <Button onClick={handleGenerate} disabled={loading} variant={showCodes ? "outline" : "default"}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {showCodes ? 'Regenerate Codes' : 'Generate Backup Codes'}
        </Button>
      </CardContent>
    </Card>
  );
};

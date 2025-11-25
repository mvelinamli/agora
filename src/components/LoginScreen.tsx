import React, { useState } from 'react';
import { Wallet, Disc } from 'lucide-react';

interface Props {
    onLogin: () => void;
}

export const LoginScreen: React.FC<Props> = ({ onLogin }) => {
    const [loading, setLoading] = useState(false);

    const handleLogin = (method: string) => {
        setLoading(true);
        // Simülasyon: 1.5 saniye bekle ve giriş yap
        setTimeout(() => {
            setLoading(false);
            onLogin();
        }, 1500);
    };

    return (
        <div className="h-screen w-screen bg-[#030712] flex items-center justify-center relative overflow-hidden">

            {/* Arka Plan Efektleri */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>

            {/* Giriş Kartı */}
            <div className="relative z-10 w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex flex-col gap-6">

                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                        <span className="text-3xl font-bold text-white">A</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">AGORA'ya Hoş Geldin</h1>
                    <p className="text-gray-400 text-sm mt-2">Yeni nesil topluluk deneyimi.</p>
                </div>

                <div className="space-y-3">
                    <button onClick={() => handleLogin('google')} disabled={loading} className="w-full flex items-center justify-center gap-3 py-3.5 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition font-bold text-sm">
                        Google ile Devam Et
                    </button>
                    <button onClick={() => handleLogin('discord')} disabled={loading} className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl transition font-bold text-sm">
                        <Disc size={20} /> Discord ile Devam Et
                    </button>
                </div>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink mx-4 text-gray-500 text-xs">VEYA</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button onClick={() => handleLogin('web3')} disabled={loading} className="w-full flex items-center justify-center gap-3 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-indigo-300 rounded-xl transition font-bold text-sm group">
                    {loading ? 'Bağlanılıyor...' : <><Wallet size={18} className="group-hover:scale-110 transition-transform" /> Web3 Cüzdanı Bağla</>}
                </button>

            </div>
            <div className="absolute bottom-6 text-xs text-gray-600 font-mono">v0.1.0 • Powered by Solana</div>
        </div>
    );
};
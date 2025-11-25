import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet, LogOut, Loader2 } from 'lucide-react';

export const WalletConnectButton = () => {
    const { publicKey, disconnect, connecting, signMessage } = useWallet();
    const { setVisible } = useWalletModal();
    const [isVerifying, setIsVerifying] = useState(false);

    const verifyOwnership = async () => {
        if (!publicKey || !signMessage) return;
        try {
            setIsVerifying(true);
            const message = new TextEncoder().encode(`AGORA Login: ${new Date().getTime()}`);
            await signMessage(message);
            setIsVerifying(false);
        } catch (error) {
            disconnect();
            setIsVerifying(false);
        }
    };

    useEffect(() => {
        if (publicKey) setTimeout(() => verifyOwnership(), 1000);
    }, [publicKey]);

    if (!publicKey) {
        return (
            <button onClick={() => setVisible(true)} className="flex items-center gap-2 px-3 py-2 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-xl backdrop-blur-md transition-all font-medium text-sm">
                {connecting ? <Loader2 className="animate-spin" size={16} /> : <Wallet size={16} />}
                <span>Bağla</span>
            </button>
        );
    }

    if (isVerifying) return <button className="text-yellow-400 text-xs animate-pulse">İmzalanıyor...</button>;

    return (
        <div className="flex items-center gap-2 group cursor-pointer" onClick={disconnect}>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-mono text-green-400">{publicKey.toBase58().slice(0, 4)}...</span>
            <LogOut size={14} className="opacity-0 group-hover:opacity-100 text-red-400 transition-opacity" />
        </div>
    );
};
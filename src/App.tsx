import React, { useState, useEffect, useRef } from 'react';
import {
  Server, Hash, Volume2, Settings, Mic, MicOff, Headphones,
  EarOff, Send, Plus, Trash2, Sun, Moon, Users,
  MoreVertical, Heart, MessageSquare, Share2, Map, Radio, Loader2
} from 'lucide-react';
import { WalletConnectButton } from './components/ui/WalletConnectButton';
import { ProfileModal } from './components/ProfileModal';
import { VoiceVisualizer } from './components/ui/VoiceVisualizer';
import { useAudioProcessor } from './hooks/useAudioProcessor';
import { LoginScreen } from './components/LoginScreen';
import { CreateServerModal, ServerSettingsModal } from './components/ServerModals';
import { supabase } from './lib/supabaseClient'; // Supabase bağlantısı

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // --- VERİLER (Artık Veritabanından Geliyor) ---
  const [servers, setServers] = useState([
    { id: 1, name: "Cyberpunk TR", icon: "C", type: "gaming" }, // Sunucular şimdilik sabit kalabilir
  ]);
  const [channels, setChannels] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigasyon
  const [activeTab, setActiveTab] = useState<'chat' | 'spatial' | 'feed'>('chat');
  const [activeServerId, setActiveServerId] = useState<number>(1);
  const [activeChannelId, setActiveChannelId] = useState<number | null>(null);
  const [showMembers, setShowMembers] = useState(true);

  // Kullanıcı Bilgisi (Geçici)
  const [currentUser, setCurrentUser] = useState("Misafir");

  // --- SUPABASE ENTEGRASYONU ---
  useEffect(() => {
    if (!isLoggedIn) return;

    const initSupabase = async () => {
      setLoading(true);

      // 1. Anonim Giriş (Yazma izni için)
      const { error: authError } = await supabase.auth.signInAnonymously();
      if (authError) console.error("Giriş hatası:", authError);

      // 2. Kanalları Çek
      const { data: channelsData } = await supabase
        .from('channels')
        .select('*')
        .order('id', { ascending: true });

      if (channelsData) {
        setChannels(channelsData);
        // İlk metin kanalını otomatik seç
        const firstText = channelsData.find((c: any) => c.type === 'text');
        if (firstText) setActiveChannelId(firstText.id);
      }

      setLoading(false);
    };

    initSupabase();
  }, [isLoggedIn]);

  // --- MESAJLARI DİNLE (REALTIME) ---
  useEffect(() => {
    if (!activeChannelId) return;

    // 1. Mevcut Mesajları Yükle
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', activeChannelId)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    };
    fetchMessages();

    // 2. Canlı Abonelik (Yeni Mesaj Gelince)
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${activeChannelId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChannelId]);


  // --- MESAJ GÖNDERME ---
  const [inputText, setInputText] = useState("");

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeChannelId) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        content: inputText,
        channel_id: activeChannelId,
        username: currentUser, // Giriş ekranında belirlediğimiz isim
        // user_id otomatik eklenir (Supabase Auth sayesinde)
      });

    if (error) console.error("Mesaj gönderme hatası:", error);
    else setInputText("");
  };

  // --- DİĞER AYARLAR ---
  const [isMicMuted, setMicMuted] = useState(false);
  const [isDeafened, setDeafened] = useState(false);
  const [spatialMode, setSpatialMode] = useState(true);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isCreateServerOpen, setCreateServerOpen] = useState(false);
  const [isServerSettingsOpen, setServerSettingsOpen] = useState(false);

  const { analyser } = useAudioProcessor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pos, setPos] = useState({ x: 300, y: 200 });

  // Kanal Tıklama
  const handleChannelClick = (channel: any) => {
    setActiveChannelId(channel.id);
    if (channel.type === 'text') setActiveTab('chat');
    else setActiveTab('spatial');
  }

  // KANAL EKLEME (Veritabanına)
  const handleAddChannel = async (type: string) => {
    const name = prompt(`${type === 'text' ? 'Metin' : 'Ses'} Kanalı Adı:`);
    if (name) {
      const { data, error } = await supabase
        .from('channels')
        .insert({ name, type, server_id: activeServerId })
        .select()
        .single();

      if (data) {
        setChannels([...channels, data]);
        setActiveChannelId(data.id);
        if (type === 'text') setActiveTab('chat'); else setActiveTab('spatial');
      }
    }
  };

  // KANAL SİLME
  const handleDeleteChannel = async (id: number) => {
    if (confirm("Bu kanalı silmek istediğine emin misin?")) {
      await supabase.from('channels').delete().eq('id', id);
      setChannels(channels.filter(c => c.id !== id));
      if (activeChannelId === id) setActiveChannelId(null);
    }
  };

  // Spatial Hareket (Şimdilik Yerel)
  useEffect(() => {
    if (activeTab === 'spatial' && spatialMode) {
      const handleMove = (e: KeyboardEvent) => {
        setPos(p => {
          const speed = 10;
          if (e.key === 'w' || e.key === 'ArrowUp') return { ...p, y: p.y - speed };
          if (e.key === 's' || e.key === 'ArrowDown') return { ...p, y: p.y + speed };
          if (e.key === 'a' || e.key === 'ArrowLeft') return { ...p, x: p.x - speed };
          if (e.key === 'd' || e.key === 'ArrowRight') return { ...p, x: p.x + speed };
          return p;
        });
      };
      window.addEventListener('keydown', handleMove);
      return () => window.removeEventListener('keydown', handleMove);
    }
  }, [activeTab, spatialMode]);

  // Canvas Çizimi
  useEffect(() => {
    if (activeTab === 'spatial' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const bgColor = isDarkMode ? '#1a1b26' : '#f3f4f6';
        const gridColor = isDarkMode ? '#333' : '#e5e7eb';
        ctx.fillStyle = bgColor; ctx.fillRect(0, 0, 800, 600);
        ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
        for (let i = 0; i < 800; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 600); ctx.stroke(); }
        for (let i = 0; i < 600; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke(); }
        ctx.fillStyle = '#4f46e5'; ctx.beginPath(); ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = isDarkMode ? 'white' : 'black'; ctx.font = '12px Arial'; ctx.fillText(currentUser, pos.x - 15, pos.y - 25);
      }
    }
  }, [pos, activeTab, isDarkMode, currentUser]);

  const theme = isDarkMode ? { bg: "bg-[#030712]", text: "text-gray-100" } : { bg: "bg-gray-100", text: "text-gray-900" };

  if (!isLoggedIn) return <LoginScreen onLogin={() => { setIsLoggedIn(true); setCurrentUser("Ahmet"); }} />;

  return (
    <div className={`h-screen w-screen ${theme.bg} flex items-center justify-center p-4 overflow-hidden relative font-sans ${theme.text} transition-colors duration-300`}>
      <ProfileModal isOpen={isProfileOpen} onClose={() => setProfileOpen(false)} />
      <CreateServerModal isOpen={isCreateServerOpen} onClose={() => setCreateServerOpen(false)} onCreate={() => { }} />
      <ServerSettingsModal isOpen={isServerSettingsOpen} onClose={() => setServerSettingsOpen(false)} server={servers.find(s => s.id === activeServerId)} />

      <div className="flex w-full h-full max-w-[1600px] gap-4 relative z-10">

        {/* SOL MENÜ */}
        <div className="w-[72px] flex flex-col gap-3 shrink-0">
          <GlassPanel isDarkMode={isDarkMode} className="h-14 bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center cursor-pointer transition-all hover:scale-105 shadow-lg group" onClick={() => setActiveTab('feed')}>
            <span className="font-bold text-xl text-white">A</span>
          </GlassPanel>

          <div className="w-full h-[2px] bg-gray-500/20 rounded-full"></div>

          {servers.map(s => (
            <GlassPanel key={s.id} isDarkMode={isDarkMode} onClick={() => { setActiveServerId(s.id); setActiveTab('chat'); }} className={`h-[72px] flex items-center justify-center cursor-pointer transition-all border-l-4 ${activeServerId === s.id ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-gray-400 hover:text-gray-500'}`}>
              <span className="font-bold text-lg">{s.icon}</span>
            </GlassPanel>
          ))}

          <GlassPanel isDarkMode={isDarkMode} onClick={() => alert("Demo modunda yeni sunucu veritabanı oluşturulamaz.")} className="h-12 flex items-center justify-center cursor-pointer text-green-500 hover:text-green-400 transition-all">
            <Plus />
          </GlassPanel>

          <div className="mt-auto flex flex-col gap-2">
            <GlassPanel isDarkMode={isDarkMode} onClick={() => setIsDarkMode(!isDarkMode)} className="h-12 flex items-center justify-center cursor-pointer text-yellow-500 hover:text-yellow-400 transition-all">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </GlassPanel>
            <GlassPanel isDarkMode={isDarkMode} onClick={() => setProfileOpen(true)} className="h-12 flex items-center justify-center cursor-pointer text-gray-400 hover:text-gray-500 transition-all"><Settings size={20} /></GlassPanel>
          </div>
        </div>

        {/* ORTA MENÜ: KANALLAR */}
        {activeTab !== 'feed' && (
          <div className="w-64 flex flex-col gap-4 shrink-0 animate-in slide-in-from-left-4 duration-300">
            <GlassPanel isDarkMode={isDarkMode} className="flex-1 p-3 flex flex-col">
              <header className="h-12 flex items-center justify-between px-2 font-bold text-lg border-b border-gray-500/10 mb-4">
                <span className="truncate">Cyberpunk TR</span>
                <MoreVertical size={16} className="cursor-pointer text-gray-500 hover:text-white" onClick={() => setServerSettingsOpen(true)} />
              </header>

              {loading ? (
                <div className="flex items-center justify-center h-32 text-gray-500"><Loader2 className="animate-spin mr-2" /> Yükleniyor...</div>
              ) : (
                <div className="space-y-6 overflow-y-auto custom-scrollbar">
                  <div>
                    <div className="flex items-center justify-between px-2 mb-2">
                      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Metin Kanalları</h3>
                      <Plus size={12} className="cursor-pointer text-gray-500 hover:text-indigo-500" onClick={() => handleAddChannel('text')} />
                    </div>
                    {channels.filter(c => c.type === 'text').map(c => (
                      <ChannelItem key={c.id} name={c.name} type="text" active={activeChannelId === c.id} onDelete={() => handleDeleteChannel(c.id)} onClick={() => handleChannelClick(c)} isDarkMode={isDarkMode} />
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center justify-between px-2 mb-2">
                      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ses Odaları</h3>
                      <Plus size={12} className="cursor-pointer text-gray-500 hover:text-indigo-500" onClick={() => handleAddChannel('voice')} />
                    </div>
                    {channels.filter(c => c.type === 'voice').map(c => (
                      <ChannelItem key={c.id} name={c.name} type="voice" active={activeChannelId === c.id} onDelete={() => handleDeleteChannel(c.id)} onClick={() => handleChannelClick(c)} tag={c.name.includes('Meydan') ? 'CANLI' : ''} isDarkMode={isDarkMode} />
                    ))}
                  </div>
                </div>
              )}
            </GlassPanel>

            <GlassPanel isDarkMode={isDarkMode} className="h-auto p-3 flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg transition" onClick={() => setProfileOpen(true)}>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-inner">A</div>
                  <div className="text-sm font-bold leading-tight">{currentUser} <span className="block text-[10px] text-gray-400 font-normal">#1923</span></div>
                </div>
                <div className="flex gap-1 text-gray-400">
                  <button onClick={() => setMicMuted(!isMicMuted)} className="p-1.5 rounded transition hover:bg-white/10">{isMicMuted ? <MicOff size={16} color="red" /> : <Mic size={16} />}</button>
                  <button onClick={() => setDeafened(!isDeafened)} className="p-1.5 rounded transition hover:bg-white/10">{isDeafened ? <EarOff size={16} color="red" /> : <Headphones size={16} />}</button>
                </div>
              </div>
              <div className="h-8 w-full opacity-80"><VoiceVisualizer analyser={analyser} isActive={!isMicMuted} /></div>
              <div className="pt-2 border-t border-gray-500/10"><WalletConnectButton /></div>
            </GlassPanel>
          </div>
        )}

        {/* 3. ANA SAHNE */}
        <GlassPanel isDarkMode={isDarkMode} className="flex-1 flex flex-col relative overflow-hidden">
          {activeTab === 'feed' ? (
            <div className="flex-1 flex items-center justify-center text-2xl font-bold text-gray-500">Akış Sayfası (Veritabanı Bağlanacak)</div>
          ) : (
            <>
              <header className="h-14 border-b border-gray-500/10 flex items-center justify-between px-6 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2">
                  {activeTab === 'chat' ? <Hash className="text-gray-400" /> : <Volume2 className="text-indigo-400" />}
                  <span className="font-bold text-lg">{channels.find(c => c.id === activeChannelId)?.name || 'Kanal Seçin'}</span>
                </div>
              </header>

              <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 flex flex-col relative">
                  {activeTab === 'chat' ? (
                    <>
                      <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col justify-end">
                        {activeChannelId ? (
                          messages.length > 0 ? messages.map((m) => (
                            <div key={m.id} className="flex gap-4 group animate-in slide-in-from-left-2 duration-200">
                              <div className={`w-10 h-10 rounded-2xl bg-indigo-500 shrink-0 shadow-lg flex items-center justify-center font-bold text-white`}>{m.username?.charAt(0) || '?'}</div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`font-bold ${isDarkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>{m.username}</span>
                                  <span className="text-[10px] text-gray-500">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm leading-relaxed`}>{m.content}</p>
                              </div>
                            </div>
                          )) : <div className="text-center text-gray-500 mt-10">Bu kanalda henüz mesaj yok. İlk sen yaz!</div>
                        ) : <div className="text-center text-gray-500 mt-10">Bir kanal seçin.</div>}
                      </div>
                      <div className="p-6 pt-2 shrink-0">
                        <div className={`backdrop-blur-md rounded-2xl flex items-center p-1.5 border border-gray-500/10 focus-within:border-indigo-500/50 transition-all ${isDarkMode ? 'bg-white/5' : 'bg-gray-200'}`}>
                          <button className="p-3 text-gray-400 hover:text-indigo-500 transition"><Plus size={20} /></button>
                          <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={`#${channels.find(c => c.id === activeChannelId)?.name || 'kanal'} kanalına mesaj gönder...`}
                            className={`flex-1 bg-transparent px-2 outline-none ${isDarkMode ? 'text-white' : 'text-black'} placeholder-gray-500`}
                            disabled={!activeChannelId}
                          />
                          <button onClick={handleSendMessage} className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition"><Send size={18} /></button>
                        </div>
                      </div>
                    </>
                  ) : (
                    // SES EKRANI
                    <div className={`flex-1 ${isDarkMode ? 'bg-[#1a1b26]' : 'bg-white'} relative flex items-center justify-center overflow-hidden`}>
                      <canvas ref={canvasRef} width={800} height={600} className="rounded-xl shadow-2xl border border-white/10" />
                      <div className="absolute top-4 left-4 bg-black/50 p-2 rounded text-xs text-white backdrop-blur-md">WASD ile hareket et</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}

// Yardımcı Bileşenler
const GlassPanel = ({ children, className, onClick, isDarkMode }: any) => (
  <div onClick={onClick} className={`backdrop-blur-xl ${isDarkMode ? 'bg-[#11131f]/60 border-white/5' : 'bg-white/70 border-gray-200'} border rounded-3xl shadow-xl overflow-hidden ${className}`}>{children}</div>
);

const ChannelItem = ({ name, type, active, onClick, tag, onDelete, isDarkMode }: any) => (
  <div onClick={onClick} className={`group flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${active ? 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30' : 'text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}>
    {type === 'text' ? <Hash size={16} /> : <Volume2 size={16} />}
    <span className="flex-1 truncate font-medium text-sm">{name}</span>
    {tag && <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded shadow-lg shadow-red-500/20">{tag}</span>}
    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition"><Trash2 size={14} /></button>
  </div>
);

export default App;
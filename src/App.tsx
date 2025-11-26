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
import { CreateServerModal, ServerSettingsModal, CreateChannelModal } from './components/ServerModals';
import { supabase } from './lib/supabaseClient';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // --- STATE YÖNETİMİ ---
  const [activeTab, setActiveTab] = useState<'chat' | 'spatial' | 'feed'>('chat');
  const [activeServerId, setActiveServerId] = useState<number>(0);
  const [activeChannelId, setActiveChannelId] = useState<number | null>(null);
  const [showMembers, setShowMembers] = useState(true);
  const [currentUser, setCurrentUser] = useState("Misafir");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Veriler
  const [servers, setServers] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  // Statik Veriler (Eksik olanlar geri eklendi)
  const [members] = useState([
    { id: 1, name: "Ahmet.agora", role: "Kurucu", status: "online", avatarColor: "bg-indigo-500" },
    { id: 2, name: "Ayşe", role: "Moderatör", status: "idle", avatarColor: "bg-pink-500" },
    { id: 3, name: "Mehmet", role: "Üye", status: "dnd", avatarColor: "bg-blue-500" },
  ]);
  const [posts] = useState([
    { id: 1, user: "Ahmet.agora", content: "AGORA v1.0 yayında! 🚀", likes: 42, comments: 5 },
    { id: 2, user: "Can_Dev", content: "Rust backend performansı şaka mı?", likes: 128, comments: 24 }
  ]);

  // Modallar
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isCreateServerOpen, setCreateServerOpen] = useState(false);
  const [isCreateChannelOpen, setCreateChannelOpen] = useState(false);
  const [isServerSettingsOpen, setServerSettingsOpen] = useState(false);

  // Medya
  const [isMicMuted, setMicMuted] = useState(false);
  const [isDeafened, setDeafened] = useState(false);
  const [spatialMode, setSpatialMode] = useState(true);

  // --- SUPABASE VERİ ÇEKME (DATA FETCHING) ---
  // --- VERİ ÇEKME (GÜNCELLENDİ: Kişiye Özel) ---
  const initData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.signInAnonymously();

    if (user) {
      setCurrentUserId(user.id);

      // 1. Sadece Üye Olduğum Sunucuları Getir
      // Bu sorgu: "server_members" tablosuna git, benim ID'me sahip satırları bul,
      // sonra o satırlardaki "server_id"yi kullanarak "servers" tablosundan detayları al.
      const { data: memberData, error } = await supabase
        .from('server_members')
        .select(`
                server_id,
                servers (
                    id,
                    name,
                    icon,
                    type
                )
            `)
        .eq('user_id', user.id);

      if (error) {
        console.error("Sunucu çekme hatası:", error);
      } else if (memberData) {
        // Gelen veri iç içe (nested) olduğu için düzleştiriyoruz:
        // [{ server_id: 1, servers: {name: "A"} }]  -->  [{id: 1, name: "A"}]
        const myServers = memberData
          .map((m: any) => m.servers) // Sadece servers objesini al
          .filter((s: any) => s !== null) // Silinmiş sunucuları filtrele
          .sort((a: any, b: any) => a.id - b.id); // ID'ye göre sırala

        setServers(myServers);

        // Eğer sunucular varsa ve seçim yapılmadıysa ilkini seç
        if (myServers.length > 0 && activeServerId === 0) {
          setActiveServerId(myServers[0].id);
        }
      }
    }

    // Kanalları çekme kısmı aynı kalabilir...
    const { data: channelData } = await supabase.from('channels').select('*');
    if (channelData) setChannels(channelData);

    setLoading(false);
  };

  initData();

  // --- REALTIME DİNLEYİCİ (ÇİFT KAYIT KORUMALI) ---
  const sub = supabase.channel('public:all')
    // Sunucu Eklendiğinde
    .on('postgres_changes', { event: '*', schema: 'public', table: 'servers' }, payload => {
      // Buraya bir kontrol koymuyoruz çünkü sunucuyu "server_members" üzerinden filtreliyoruz.
      // Yeni sunucu eklendiğinde anlık gelmesi için "server_members"ı dinlemek daha doğru olurdu ama
      // şimdilik manuel ekleme ile (handleCreateServer) bunu çözüyoruz.
    })
    // Kanal Eklendiğinde
    .on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, payload => {
      if (payload.eventType === 'INSERT') {
        setChannels(prev => {
          // KORUMA: Eğer bu kanal zaten listede varsa, tekrar ekleme!
          if (prev.find(c => c.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      }
      if (payload.eventType === 'DELETE') setChannels(prev => prev.filter(c => c.id !== payload.old.id));
    })
    .subscribe();

  return () => { supabase.removeChannel(sub); };
}, [isLoggedIn]);

// --- MESAJLARI YÖNET ---
useEffect(() => {
  if (!activeChannelId) return;
  const fetchMessages = async () => {
    const { data } = await supabase.from('messages').select('*').eq('channel_id', activeChannelId).order('created_at', { ascending: true });
    if (data) setMessages(data); else setMessages([]);
  };
  fetchMessages();
  const msgSub = supabase.channel(`messages:${activeChannelId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${activeChannelId}` }, payload => {
      setMessages(prev => {
        // KORUMA: Çift mesajı engelle
        if (prev.find(m => m.id === payload.new.id)) return prev;
        return [...prev, payload.new];
      });
    })
    .subscribe();
  return () => { supabase.removeChannel(msgSub); };
}, [activeChannelId]);

const visibleChannels = channels.filter(c => c.server_id === activeServerId);

// Otomatik Kanal Seçimi
useEffect(() => {
  // Sadece sunucu değiştiğinde veya ilk yüklemede çalışsın
  if (visibleChannels.length > 0) {
    const currentChannelExists = visibleChannels.find(c => c.id === activeChannelId);
    if (!currentChannelExists) {
      const firstText = visibleChannels.find(c => c.type === 'text');
      if (firstText) {
        setActiveChannelId(firstText.id);
        setActiveTab('chat');
      } else {
        setActiveChannelId(null);
      }
    }
  }
}, [activeServerId, channels]); // Dependency array önemli


// --- İŞLEVLER (FONKSİYONLAR) ---

const handleServerClick = (serverId: number) => {
  setActiveServerId(serverId);
  setActiveTab('chat'); // Akıştan çık, sohbete dön

  // O sunucunun ilk kanalını bul
  const serverChannels = channels.filter(c => c.server_id === serverId);
  const firstText = serverChannels.find(c => c.type === 'text');
  if (firstText) setActiveChannelId(firstText.id);
}

// --- SUNUCU OLUŞTURMA (GÜNCELLENDİ: Hata Kontrolü ve Liste Yenileme) ---
const handleCreateServer = async (name: string, type: string) => {
  if (!currentUserId) return;

  // 1. Sunucuyu Oluştur
  const { data: server, error } = await supabase
    .from('servers')
    .insert({ name, icon: name.charAt(0).toUpperCase(), type })
    .select()
    .single();

  // HATA YÖNETİMİ: Eğer isim zaten varsa (Unique Constraint)
  if (error) {
    if (error.code === '23505') { // PostgreSQL Unique Violation Kodu
      alert("Bu isimde bir sunucu zaten var! Lütfen başka bir isim seç.");
    } else {
      alert("Hata: " + error.message);
    }
    return;
  }

  if (server) {
    // 2. Kendini Üye Yap
    const { error: memberError } = await supabase
      .from('server_members')
      .insert({ user_id: currentUserId, server_id: server.id });

    if (memberError) console.error("Üyelik hatası:", memberError);

    // 3. Varsayılan Kanalları Ekle
    await supabase.from('channels').insert([
      { name: "genel", type: "text", server_id: server.id },
      { name: "Meydan", type: "voice", server_id: server.id }
    ]);

    // 4. LİSTEYİ GÜNCELLE (Kritik Nokta)
    // Veritabanından tekrar çekmek yerine, elimizdeki veriyi listeye ekliyoruz.
    // Böylece ekran anında güncelleniyor.
    setServers(prevServers => [...prevServers, server]);

    // 5. Yeni Sunucuya Geçiş Yap
    setActiveServerId(server.id);
    // (Kanal seçimini sıfırla ki yeni sunucunun kanallarını yüklesin)
    setActiveChannelId(null);
  }
};

const handleAddChannel = async (name: string, type: string) => {
  const { data, error } = await supabase.from('channels').insert({
    name, type, server_id: activeServerId
  }).select().single();

  if (error) alert(error.message);
  else if (data) {
    setChannels(prev => [...prev, data]);
    handleChannelClick(data);
  }
};

const handleDeleteChannel = async (id: number) => {
  if (confirm("Silmek istediğine emin misin?")) {
    await supabase.from('channels').delete().eq('id', id);
  }
};

const handleSendMessage = async () => {
  if (!inputText.trim() || !activeChannelId) return;
  await supabase.from('messages').insert({ content: inputText, channel_id: activeChannelId, username: currentUser });
  setInputText("");
};

const handleChannelClick = (channel: any) => {
  setActiveChannelId(channel.id);
  if (channel.type === 'text') setActiveTab('chat');
  else setActiveTab('spatial');
}

// --- DİĞER BİLEŞENLER ---
const [inputText, setInputText] = useState("");
const { analyser } = useAudioProcessor();
const canvasRef = useRef<HTMLCanvasElement>(null);
const [pos, setPos] = useState({ x: 300, y: 200 });
const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({});
const channelRef = useRef<any>(null);

// Multiplayer Logic
useEffect(() => {
  if (activeTab !== 'spatial' || !activeChannelId) return;
  const channel = supabase.channel(`room:${activeChannelId}`, { config: { presence: { key: currentUser } } });
  channel.on('presence', { event: 'sync' }, () => {
    const newState = channel.presenceState();
    const users: any = {};
    for (const key in newState) if (key !== currentUser) users[key] = newState[key][0];
    setOnlineUsers(users);
  }).subscribe(async (status) => {
    if (status === 'SUBSCRIBED') await channel.track({ x: pos.x, y: pos.y, username: currentUser });
  });
  channelRef.current = channel;
  return () => { supabase.removeChannel(channel); channelRef.current = null; };
}, [activeTab, activeChannelId]);

useEffect(() => { if (channelRef.current && activeTab === 'spatial') channelRef.current.track({ x: pos.x, y: pos.y, username: currentUser }); }, [pos]);

// Canvas Draw
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
      Object.values(onlineUsers).forEach((user: any) => {
        ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(user.x, user.y, 20, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = isDarkMode ? 'white' : 'black'; ctx.font = '12px Arial'; ctx.fillText(user.username, user.x - 15, user.y - 25);
      });
      ctx.fillStyle = '#4f46e5'; ctx.beginPath(); ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = isDarkMode ? 'white' : 'black'; ctx.font = '12px Arial'; ctx.fillText(currentUser, pos.x - 15, pos.y - 25);
    }
  }
}, [pos, activeTab, isDarkMode, currentUser, onlineUsers]);

// Key Event
useEffect(() => {
  if (activeTab === 'spatial') {
    const move = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return; // Yazı yazarken hareket etme
      if (e.key === 'w') setPos(p => ({ ...p, y: p.y - 10 }));
      if (e.key === 's') setPos(p => ({ ...p, y: p.y + 10 }));
      if (e.key === 'a') setPos(p => ({ ...p, x: p.x - 10 }));
      if (e.key === 'd') setPos(p => ({ ...p, x: p.x + 10 }));
    };
    window.addEventListener('keydown', move);
    return () => window.removeEventListener('keydown', move);
  }
}, [activeTab]);

const theme = isDarkMode ? { bg: "bg-[#030712]", text: "text-gray-100" } : { bg: "bg-gray-100", text: "text-gray-900" };

if (!isLoggedIn) return <LoginScreen onLogin={(name) => { setCurrentUser(name); setIsLoggedIn(true); }} />;

return (
  <div className={`h-screen w-screen ${theme.bg} flex items-center justify-center p-4 overflow-hidden relative font-sans ${theme.text}`}>
    <ProfileModal isOpen={isProfileOpen} onClose={() => setProfileOpen(false)} />
    <CreateServerModal isOpen={isCreateServerOpen} onClose={() => setCreateServerOpen(false)} onCreate={handleCreateServer} />
    <CreateChannelModal isOpen={isCreateChannelOpen} onClose={() => setCreateChannelOpen(false)} onCreate={handleAddChannel} />
    <ServerSettingsModal isOpen={isServerSettingsOpen} onClose={() => setServerSettingsOpen(false)} server={servers.find(s => s.id === activeServerId)} />

    <div className="flex w-full h-full max-w-[1600px] gap-4 relative z-10">

      {/* SOL SÜTUN */}
      <div className="w-[72px] flex flex-col gap-3 shrink-0">
        <GlassPanel isDarkMode={isDarkMode} className="h-14 bg-indigo-600 flex items-center justify-center cursor-pointer" onClick={() => setActiveTab('feed')}><span className="font-bold text-xl text-white">A</span></GlassPanel>
        <div className="w-full h-[2px] bg-gray-500/20 rounded-full"></div>
        {servers.map(s => (
          <GlassPanel key={s.id} isDarkMode={isDarkMode} onClick={() => handleServerClick(s.id)} className={`h-[72px] flex items-center justify-center cursor-pointer transition-all border-l-4 ${activeServerId === s.id ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-gray-400'}`}>
            <span className="font-bold text-lg">{s.icon}</span>
          </GlassPanel>
        ))}
        <GlassPanel isDarkMode={isDarkMode} onClick={() => setCreateServerOpen(true)} className="h-12 flex items-center justify-center cursor-pointer text-green-500 hover:text-green-400 transition-all"><Plus /></GlassPanel>
        <div className="mt-auto flex flex-col gap-2">
          <GlassPanel isDarkMode={isDarkMode} onClick={() => setIsDarkMode(!isDarkMode)} className="h-12 flex items-center justify-center cursor-pointer text-yellow-500 hover:text-yellow-400 transition-all">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</GlassPanel>
          <GlassPanel isDarkMode={isDarkMode} onClick={() => setProfileOpen(true)} className="h-12 flex items-center justify-center cursor-pointer text-gray-400 hover:text-gray-500 transition-all"><Settings size={20} /></GlassPanel>
        </div>
      </div>

      {/* ORTA SÜTUN */}
      {activeTab !== 'feed' && (
        <div className="w-64 flex flex-col gap-4 shrink-0 animate-in slide-in-from-left-4 duration-300">
          <GlassPanel isDarkMode={isDarkMode} className="flex-1 p-3 flex flex-col">
            <header className="h-12 flex items-center justify-between px-2 font-bold text-lg border-b border-gray-500/10 mb-4">
              <span className="truncate">{servers.find(s => s.id === activeServerId)?.name || 'Sunucu'}</span>
              <MoreVertical size={16} className="cursor-pointer text-gray-500 hover:text-white" onClick={() => setServerSettingsOpen(true)} />
            </header>
            {loading ? <div className="flex items-center justify-center h-32 text-gray-500"><Loader2 className="animate-spin mr-2" /> Yükleniyor...</div> : (
              <div className="space-y-6 overflow-y-auto custom-scrollbar">
                <div>
                  <div className="flex items-center justify-between px-2 mb-2"><h3 className="text-[10px] font-bold text-gray-500 uppercase">Metin</h3><Plus size={12} className="cursor-pointer text-gray-500 hover:text-indigo-500" onClick={() => setCreateChannelOpen(true)} /></div>
                  {visibleChannels.filter(c => c.type === 'text').map(c => (
                    <ChannelItem key={c.id} name={c.name} type="text" active={activeChannelId === c.id} onDelete={() => handleDeleteChannel(c.id)} onClick={() => handleChannelClick(c)} isDarkMode={isDarkMode} />
                  ))}
                </div>
                <div>
                  <div className="flex items-center justify-between px-2 mb-2"><h3 className="text-[10px] font-bold text-gray-500 uppercase">Ses</h3><Plus size={12} className="cursor-pointer text-gray-500 hover:text-indigo-500" onClick={() => setCreateChannelOpen(true)} /></div>
                  {visibleChannels.filter(c => c.type === 'voice').map(c => (
                    <ChannelItem key={c.id} name={c.name} type="voice" active={activeChannelId === c.id} onDelete={() => handleDeleteChannel(c.id)} onClick={() => handleChannelClick(c)} tag={c.name.includes('Meydan') ? 'CANLI' : ''} isDarkMode={isDarkMode} />
                  ))}
                </div>
              </div>
            )}
          </GlassPanel>
          <GlassPanel isDarkMode={isDarkMode} className="h-auto p-3 flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg" onClick={() => setProfileOpen(true)}>
                <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white">{currentUser.charAt(0)}</div>
                <div className="text-sm font-bold">{currentUser}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setMicMuted(!isMicMuted)} className="p-1.5">{isMicMuted ? <MicOff size={16} color="red" /> : <Mic size={16} />}</button>
                <button onClick={() => setDeafened(!isDeafened)} className="p-1.5">{isDeafened ? <EarOff size={16} color="red" /> : <Headphones size={16} />}</button>
              </div>
            </div>
            <div className="h-8 w-full opacity-80"><VoiceVisualizer analyser={analyser} isActive={!isMicMuted} /></div>
            <div className="pt-2 border-t border-gray-500/10"><WalletConnectButton /></div>
          </GlassPanel>
        </div>
      )}

      {/* SAĞ SAHNE */}
      <GlassPanel isDarkMode={isDarkMode} className="flex-1 flex flex-col relative overflow-hidden">
        {activeTab === 'feed' ? (
          <div className="flex-1 flex flex-col bg-transparent">
            <header className={`h-16 border-b border-gray-500/10 flex items-center justify-between px-8 shrink-0`}>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Akış</h1>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-500 transition">Paylaşım Yap</button>
            </header>
            <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full space-y-6">
              {posts.map(post => (
                <div key={post.id} className={`${isDarkMode ? 'bg-white/5' : 'bg-white'} border border-gray-500/10 rounded-3xl p-6 shadow-sm`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white text-lg">{post.user.charAt(0)}</div>
                    <div><div className="font-bold">{post.user}</div><div className="text-xs text-gray-500">2 saat önce</div></div>
                  </div>
                  <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{post.content}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <header className="h-14 border-b border-gray-500/10 flex items-center justify-between px-6 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2">
                {activeTab === 'chat' ? <Hash className="text-gray-400" /> : <Volume2 className="text-indigo-400" />}
                <span className="font-bold text-lg">{channels.find(c => c.id === activeChannelId)?.name || 'Kanal Seçin'}</span>
              </div>
              <div className="flex items-center gap-4">
                <Users onClick={() => setShowMembers(!showMembers)} className="cursor-pointer text-gray-400" />
              </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 flex flex-col relative">
                {activeTab === 'chat' ? (
                  <>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col justify-end">
                      {activeChannelId ? (
                        messages.length > 0 ? messages.map((m) => (
                          <div key={m.id} className="flex gap-4 group animate-in slide-in-from-left-2">
                            <div className={`w-10 h-10 rounded-2xl bg-indigo-500 shrink-0 flex items-center justify-center font-bold text-white`}>{m.username?.charAt(0) || '?'}</div>
                            <div>
                              <div className="flex items-center gap-2 mb-1"><span className="font-bold">{m.username}</span><span className="text-xs text-gray-500">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                              <p className="text-gray-300 text-sm">{m.content}</p>
                            </div>
                          </div>
                        )) : <div className="text-center text-gray-500 mt-10">Bu kanalda henüz mesaj yok. İlk sen yaz!</div>
                      ) : <div className="text-center text-gray-500 mt-10">Bir kanal seçin.</div>}
                    </div>
                    <div className="p-6 pt-2 shrink-0">
                      <div className={`rounded-2xl flex items-center p-1.5 border border-gray-500/10 ${isDarkMode ? 'bg-white/5' : 'bg-gray-200'}`}>
                        <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Mesaj gönder..." className="flex-1 bg-transparent px-2 outline-none" disabled={!activeChannelId} />
                        <button onClick={handleSendMessage} className="p-2 bg-indigo-600 text-white rounded-xl"><Send size={18} /></button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={`flex-1 ${isDarkMode ? 'bg-[#1a1b26]' : 'bg-white'} relative flex items-center justify-center overflow-hidden`}>
                    {spatialMode ? (
                      <>
                        <canvas ref={canvasRef} width={800} height={600} className="rounded-xl shadow-2xl border border-white/10" />
                        <div className="absolute top-4 left-4 bg-black/50 p-2 rounded text-xs text-white backdrop-blur-md">WASD ile hareket et</div>
                        <div className="absolute top-4 right-4 flex gap-2 bg-black/50 p-1 rounded-lg backdrop-blur-md">
                          <button onClick={() => setSpatialMode(false)} className={`p-2 rounded ${!spatialMode ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}><Radio size={16} /></button>
                          <button onClick={() => setSpatialMode(true)} className={`p-2 rounded ${spatialMode ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}><Map size={16} /></button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto animate-pulse"><Volume2 className="text-indigo-500" size={48} /></div>
                        <h2 className="text-2xl font-bold text-gray-500">Standart Ses Modu</h2>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {showMembers && <div className={`w-60 border-l border-gray-500/10 ${isDarkMode ? 'bg-black/20' : 'bg-gray-50/50'} flex flex-col p-4`}><div className="text-center text-gray-500">Üye Listesi</div></div>}
            </div>
          </>
        )}
      </GlassPanel>
    </div>
  </div>
);
}

// --- BİLEŞENLER ---
const GlassPanel = ({ children, className, onClick, isDarkMode }: any) => (
  <div onClick={onClick} className={`backdrop-blur-xl ${isDarkMode ? 'bg-[#11131f]/60 border-white/5' : 'bg-white/70 border-gray-200'} border rounded-3xl shadow-xl overflow-hidden ${className}`}>{children}</div>
);

const ChannelItem = ({ name, type, active, onClick, tag, onDelete, isDarkMode }: any) => (
  <div onClick={onClick} className={`group flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${active ? 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30' : 'text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'}`}>
    {type === 'text' ? <Hash size={16} /> : <Volume2 size={16} />}
    <span className="flex-1 truncate font-medium text-sm">{name}</span>
    {tag && <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded">{tag}</span>}
    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500"><Trash2 size={14} /></button>
  </div>
);

export default App;
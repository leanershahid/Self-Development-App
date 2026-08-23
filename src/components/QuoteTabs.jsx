import React, { useState } from 'react';
import { Heart, Star, Sparkles, Coffee, Sun, Moon, Zap, Cloud } from 'lucide-react';
import Navbar from './NavBar';
import QuoteManager from './QuoteManager';

export default function QuoteTabs() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: 0,
      icon: Heart,
      label: 'Motivation',
      color: 'from-fuchsia-500 to-pink-500',
      bgColor: 'bg-fuchsia-500/10',
      textColor: 'text-fuchsia-400',
      quote: 'തോൽക്കുന്നതിനേക്കാൾ നല്ലത് ചത്ത് തോലയുന്നതാ !.. ഇനി നീ സിഗരറ്റ് വലിച്ചാൽ പോയി ചത്ത് തോലയ് , ',
      description: 'There is no more chances for you so do or die.',
      image: 'https://tse2.mm.bing.net/th/id/OIP.scUlGVp2udvDg17EvutY2gHaEK?pid=Api&P=0&h=180'
    },
    {
      id: 1,
      icon: Star,
      label: 'Success',
      color: 'from-cyan-400 to-blue-500',
      bgColor: 'bg-cyan-500/10',
      textColor: 'text-cyan-400',
      quote: 'Success is not the key to happiness. Happiness is the key to success.',
      author: 'Albert Schweitzer',
      description: 'If you love what you are doing, you will be successful in every aspect of life.',
      image: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=400&h=300&fit=crop'
    },
    {
      id: 2,
      icon: Sparkles,
      label: 'Dreams',
      color: 'from-indigo-400 to-purple-500',
      bgColor: 'bg-indigo-500/10',
      textColor: 'text-indigo-400',
      quote: 'My dream isn’t fame — it’s to write a script that lives longer than me.',
      author: 'Eleanor Roosevelt',
      description: 'Dream big, work hard, stay focused, and surround yourself with good people.',
      image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=300&fit=crop'
    },
    {
      id: 3,
      icon: Coffee,
      label: 'Life',
      color: 'from-emerald-400 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-400',
      quote: 'Take care of yourself first before taking care of others.Show yourself respect before giving it to others. Value yourself first before valuing others more than you. Moral of the story : treat yourself right first, so you can treat others better.',
      author: 'Vibezone',
      description: 'Be best version of yourself',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'
    },
    {
      id: 4,
      icon: Sun,
      label: 'Happiness',
      color: 'from-amber-400 to-orange-500',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-400',
      quote: 'I don’t need smoke or drinks to feel alive.',
      description: 'The most important thing is to enjoy your life, to be happy, it\'s all that matters.',
      image: 'https://images.unsplash.com/photo-1533777324565-a040eb52facd?w=400&h=300&fit=crop'
    },
    {
      id: 5,
      icon: Zap,
      label: 'Energy',
      color: 'from-rose-400 to-red-500',
      bgColor: 'bg-rose-500/10',
      textColor: 'text-rose-400',
      quote: 'I just want to speak with the people I love, without judgment, without hurting, without becoming a burden.',
      author: 'Benjamin Franklin',
      description: 'The energy of the mind is the essence of life. Keep your energy positive and focused.',
      image: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=400&h=300&fit=crop'
    }
  ];

  const activeContent = tabs[activeTab];
  const Icon = activeContent.icon;

  return (
    <div className="animate-slideIn" style={{ animationDelay: '0.1s' }}>
      <Navbar />
      <QuoteManager />

      <style>{`
        .dash-glass {
          background: rgba(255,255,255,0.55);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(134,151,196,0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
      `}</style>

      <div className="py-12 px-4 relative z-0">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-4 dash-glass rounded-2xl mb-4 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
              <Sparkles size={42} strokeWidth={2} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-white to-gray-400 mb-2 tracking-tight">
              Daily Inspiration
            </h1>
            <p className="text-cyan-400/60 font-mono text-sm tracking-widest uppercase">Select a paradigm to calibrate mindset</p>
          </div>

          {/* Tabs Navigation */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-xl font-mono text-xs tracking-widest uppercase transition-all transform hover:scale-105 flex items-center gap-2 border ${activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-[0_0_15px_rgba(255,255,255,0.2)] border-transparent`
                      : 'bg-gray-900/50 text-gray-500 border-white/10 hover:bg-gray-800 hover:text-gray-300 hover:border-white/20'
                    }`}
                >
                  <TabIcon size={16} strokeWidth={2} className={activeTab === tab.id ? 'text-white' : tab.textColor} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Card */}
          <div
            className={`dash-glass rounded-3xl overflow-hidden transition-all duration-500 border-t ${activeContent.textColor.replace('text', 'border')}/30`}
            style={{
              boxShadow: `0 20px 40px rgba(0, 0, 0, 0.4), 0 0 40px ${activeContent.color.split(' ')[0].replace('from-', '').replace('400', '500/10')}`
            }}
          >
            <div className="grid md:grid-cols-2 gap-0">

              {/* Image Section */}
              <div className="relative h-80 md:h-auto overflow-hidden">
                <img
                  src={activeContent.image}
                  alt={activeContent.label}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110 opacity-70 mix-blend-luminosity"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${activeContent.color} mix-blend-multiply opacity-50`}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80"></div>

                <div className="absolute top-6 left-6">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gray-900/80 backdrop-blur-md flex items-center justify-center border border-white/10 ${activeContent.textColor} shadow-lg`}
                  >
                    <Icon size={28} strokeWidth={1.5} />
                  </div>
                </div>
              </div>

              {/* Text Section */}
              <div className="p-10 md:p-12 flex flex-col justify-center relative">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Icon size={120} className={activeContent.textColor} />
                </div>

                <div className="mb-6 relative z-10">
                  <span
                    className={`inline-block px-3 py-1 rounded text-[10px] font-mono tracking-widest uppercase border ${activeContent.bgColor} ${activeContent.textColor} ${activeContent.textColor.replace('text', 'border')}/30`}
                  >
                    {activeContent.label} Protocol
                  </span>
                </div>

                <h2 className="text-2xl md:text-3xl font-light text-gray-200 mb-6 leading-relaxed relative z-10">
                  "{activeContent.quote}"
                </h2>

                <p className="text-gray-500 text-sm font-light mb-8 leading-relaxed relative z-10">
                  {activeContent.description}
                </p>

                <div className="flex items-center gap-4 relative z-10">
                  <div
                    className={`w-12 h-[1px] bg-gradient-to-r ${activeContent.color}`}
                  ></div>
                  <p className={`text-xs font-mono tracking-widest uppercase ${activeContent.textColor}`}>
                    SOURCE // {activeContent.author || 'UNKNOWN'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-10 relative z-10 pt-8 border-t border-white/5">
                  <button
                    className={`px-8 py-3.5 rounded-xl bg-gradient-to-r ${activeContent.color} text-white text-xs font-semibold tracking-widest uppercase hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all transform hover:scale-[1.02] active:scale-95`}
                  >
                    Store Data
                  </button>
                  <button
                    className="px-8 py-3.5 rounded-xl bg-gray-900/50 border border-white/10 text-gray-400 text-xs font-semibold tracking-widest uppercase hover:bg-gray-800 transition-all transform hover:scale-[1.02] active:scale-95"
                  >
                    Broadcast
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Navigation Dots */}
          <div className="flex justify-center gap-3 mt-10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`transition-all duration-300 ${activeTab === tab.id
                    ? `w-16 h-1.5 bg-gradient-to-r ${tab.color} rounded-full shadow-[0_0_10px_${tab.color.split(' ')[0].replace('from-', '')}]`
                    : 'w-4 h-1.5 bg-gray-700/50 rounded-full hover:bg-gray-600'
                  }`}
              />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
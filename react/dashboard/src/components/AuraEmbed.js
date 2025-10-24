import React, { useEffect, useRef } from 'react';

const AuraEmbed = () => {
  const containerRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current) return;

    console.log('AuraEmbed component mounting...');
    
    const loadAuraScript = () => {
      return new Promise((resolve, reject) => {
        // Check if script already exists
        const existingScript = document.querySelector('script[src*="auraembed-api.uit.yorku.ca"]');
        if (existingScript) {
          console.log('Aura script already exists, removing...');
          existingScript.remove();
        }

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://auraembed-api.uit.yorku.ca/embed/212/load';
        script.async = true;
        
        script.onload = () => {
          console.log('Aura script loaded in component');
          scriptLoadedRef.current = true;
          resolve();
        };
        
        script.onerror = (error) => {
          console.error('Aura script failed to load:', error);
          reject(error);
        };
        
        // Append to document head
        document.head.appendChild(script);
      });
    };

    const initializeAura = async () => {
      try {
        await loadAuraScript();
        
        // Wait a bit for Aura to initialize
        setTimeout(() => {
          console.log('Checking for Aura initialization...');
          
          // Force Aura to render if it has a manual init method
          if (window.Aura && typeof window.Aura.init === 'function') {
            console.log('Manually initializing Aura...');
            window.Aura.init();
          }
          
          // Check for Aura elements
          const auraElements = document.querySelectorAll('[id*="aura"], [class*="aura"], iframe[src*="aura"]');
          console.log('Aura elements found:', auraElements.length);
          
          // Log all potential chat/bot elements
          const chatElements = document.querySelectorAll('[id*="chat"], [class*="chat"], [id*="bot"], [class*="bot"]');
          console.log('Chat/bot elements found:', chatElements.length);
          
          if (auraElements.length === 0 && chatElements.length === 0) {
            console.warn('No Aura elements found. The embed might not be working properly.');
          }
        }, 3000);
        
      } catch (error) {
        console.error('Failed to initialize Aura embed:', error);
      }
    };

    initializeAura();

    // Cleanup
    return () => {
      const script = document.querySelector('script[src*="auraembed-api.uit.yorku.ca"]');
      if (script) {
        script.remove();
      }
      scriptLoadedRef.current = false;
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      id="aura-embed-container"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        pointerEvents: 'none' // Allow clicks to pass through until Aura renders
      }}
    >
      {/* Aura will inject its widget here */}
    </div>
  );
};

export default AuraEmbed;

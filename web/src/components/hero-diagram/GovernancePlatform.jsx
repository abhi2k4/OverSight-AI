import React, { useState, useEffect } from 'react';
import './GovernancePlatform.css';

// Import logos
import datahubLogo from '@/assets/hero/datahub.png';
import langfuseLogo from '@/assets/hero/langfuse.png';
import keycloakLogo from '@/assets/hero/keycloak.webp';
import minioLogo from '@/assets/hero/minio.svg';

// Import card images
import contextImage from '@/assets/hero/context.png';
import observeImage from '@/assets/hero/observe.png';
import trustImage from '@/assets/hero/trust.png';

const GovernancePlatform = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="governance-container">
      <div className="main-section">
        {/* Cloud SVG */}
        <div className={`cloud-svg-container ${isVisible ? 'animate-in' : ''}`}>
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 900 500" 
            preserveAspectRatio="xMidYMid meet"
            className="cloud-svg"
          >
            <defs>
              <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: '#e8e4f0', stopOpacity: 1}} />
                <stop offset="50%" style={{stopColor: '#dce0ed', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: '#d0dce8', stopOpacity: 1}} />
              </linearGradient>
              <filter id="cloudShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="12"/>
                <feOffset dx="0" dy="8" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.15"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Cloud Shape */}
            <g filter="url(#cloudShadow)" className="cloud-group">
              {/* Main cloud body - adjusted positioning */}
              <ellipse cx="450" cy="250" rx="420" ry="180" fill="url(#cloudGradient)"/>
              
              {/* Left puff */}
              <circle cx="120" cy="240" r="120" fill="url(#cloudGradient)"/>
              
              {/* Left-center puff */}
              <circle cx="280" cy="180" r="140" fill="url(#cloudGradient)"/>
              
              {/* Right-center puff */}
              <circle cx="620" cy="180" r="140" fill="url(#cloudGradient)"/>
              
              {/* Right puff */}
              <circle cx="780" cy="240" r="120" fill="url(#cloudGradient)"/>
              
              {/* Top center puff */}
              <circle cx="450" cy="140" r="160" fill="url(#cloudGradient)"/>
            </g>
          </svg>

          {/* Cards inside cloud */}
          <div className="cloud-content">
            {/* Context Card */}
            <div className="card card-context">
              <div className="card-icon">
                <svg width="36" height="36" viewBox="0 0 45 45" fill="none">
                  <rect x="8" y="11" width="24" height="20" rx="2" stroke="#5854c7" strokeWidth="2.5" fill="none"/>
                  <path d="M8 15 L32 15" stroke="#5854c7" strokeWidth="2.5"/>
                  <line x1="11" y1="19" x2="21" y2="19" stroke="#5854c7" strokeWidth="2"/>
                  <line x1="11" y1="23" x2="28" y2="23" stroke="#5854c7" strokeWidth="2"/>
                  <line x1="11" y1="27" x2="24" y2="27" stroke="#5854c7" strokeWidth="2"/>
                  <path d="M28 23 L33 18 L33 28 Z" fill="#5854c7"/>
                </svg>
              </div>
              <div className="card-content-text">
                <div className="card-title">CONTEXT</div>
                <div className="card-subtitle">Data & AI Governance</div>
              </div>
              <div className="card-image">
                <img src={contextImage} alt="Context" className="card-image-photo" />
              </div>
            </div>

            {/* Observe Card */}
            <div className="card card-observe">
              <div className="card-icon">
                <svg width="36" height="36" viewBox="0 0 45 45" fill="none">
                  <ellipse cx="22.5" cy="22.5" rx="16" ry="10" stroke="#4a8e4a" strokeWidth="2.5" fill="none"/>
                  <circle cx="22.5" cy="22.5" r="7" fill="#4a8e4a"/>
                  <circle cx="22.5" cy="22.5" r="3.5" fill="white"/>
                </svg>
              </div>
              <div className="card-content-text">
                <div className="card-title">OBSERVE</div>
                <div className="card-subtitle">AI Agents & Usage</div>
              </div>
              <div className="card-image">
                <img src={observeImage} alt="Observe" className="card-image-photo" />
              </div>
            </div>

            {/* Trust Card */}
            <div className="card card-trust">
              <div className="card-icon">
                <svg width="36" height="36" viewBox="0 0 45 45" fill="none">
                  <path d="M22.5 8 L10 15 L10 26 Q10 34 22.5 39 Q35 34 35 26 L35 15 Z" stroke="#8b5ba8" strokeWidth="2.5" fill="none"/>
                  <path d="M16 23 L20 27 L29 18" stroke="#8b5ba8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
              <div className="card-content-text">
                <div className="card-title">TRUST</div>
                <div className="card-subtitle">Risk & Compliance<br/>Audits</div>
              </div>
              <div className="card-image">
                <img src={trustImage} alt="Trust" className="card-image-photo" />
              </div>
            </div>
          </div>
        </div>

        {/* Purple base bar - positioned to touch cloud bottom */}
        <div className="cloud-base"></div>
      </div>

      {/* Bottom Section with Logos */}
      <div className="bottom-section">
        {/* Connection lines SVG */}
        <svg className="connection-svg" viewBox="0 0 1400 120" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor: '#8b7bb8', stopOpacity: 0.5}} />
              <stop offset="100%" style={{stopColor: '#a896c8', stopOpacity: 0.2}} />
            </linearGradient>
          </defs>
          
          {/* Lines from cloud bottom to each logo */}
          <line x1="700" y1="0" x2="220" y2="120" stroke="url(#lineGradient)" strokeWidth="2.5" className="connection-line line-1"/>
          <line x1="700" y1="0" x2="520" y2="120" stroke="url(#lineGradient)" strokeWidth="2.5" className="connection-line line-2"/>
          <line x1="700" y1="0" x2="880" y2="120" stroke="url(#lineGradient)" strokeWidth="2.5" className="connection-line line-3"/>
          <line x1="700" y1="0" x2="1180" y2="120" stroke="url(#lineGradient)" strokeWidth="2.5" className="connection-line line-4"/>
        </svg>

        <div className="logos-container justify-evenly">
          {/* DataHub */}
          <div className="logo-item logo-item-1">
            <div className="logo-placeholder">
              <img src={datahubLogo} alt="DataHub" className="logo-image" />
            </div>
              </div>

          {/* Langfuse */}
          <div className="logo-item logo-item-2">
            <div className="logo-placeholder">
              <img src={langfuseLogo} alt="Langfuse" className="logo-image" />
            </div>
            <div className="logo-name">Langfuse</div>
          </div>

          {/* Keycloak */}
          <div className="logo-item logo-item-3">
            <div className="logo-placeholder">
              <img src={keycloakLogo} alt="Keycloak" className="logo-image" />
            </div>
          </div>

          {/* Minio */}
          <div className="logo-item logo-item-4">
            <div className="logo-placeholder">
              <img src={minioLogo} alt="Minio" className="logo-image" />
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GovernancePlatform;

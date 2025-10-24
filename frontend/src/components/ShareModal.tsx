import React, { useState, useRef } from 'react';
import { X, Copy, Download, Share2, Mail, MessageCircle, Check, QrCode as QrCodeIcon } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionnaireId: string;
  questionnaireTitle: string;
  language?: 'en' | 'sq' | 'sr';
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  questionnaireId,
  questionnaireTitle,
  language = 'en'
}) => {
  const [copied, setCopied] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const translations = {
    en: {
      shareQuestionnaire: 'Share Questionnaire',
      shareWith: 'Share with',
      copyLink: 'Copy Link',
      linkCopied: 'Link Copied!',
      downloadQR: 'Download QR Code',
      showQR: 'Show QR Code',
      hideQR: 'Hide QR Code',
      shareVia: 'Share via',
      email: 'Email',
      whatsApp: 'WhatsApp',
      viber: 'Viber',
      telegram: 'Telegram',
      messenger: 'Messenger',
      native: 'More Options',
      qrCodeTitle: 'QR Code',
      qrCodeDescription: 'Scan this code to access the questionnaire',
      close: 'Close'
    },
    sq: {
      shareQuestionnaire: 'Shpërndaje Pyetësorin',
      shareWith: 'Shpërnda me',
      copyLink: 'Kopjo Linkun',
      linkCopied: 'Linku u Kopjua!',
      downloadQR: 'Shkarko QR Code',
      showQR: 'Shfaq QR Code',
      hideQR: 'Fshih QR Code',
      shareVia: 'Shpërnda përmes',
      email: 'Email',
      whatsApp: 'WhatsApp',
      viber: 'Viber',
      telegram: 'Telegram',
      messenger: 'Messenger',
      native: 'Më Shumë Opsione',
      qrCodeTitle: 'QR Code',
      qrCodeDescription: 'Skano këtë kod për të hyrë në pyetësor',
      close: 'Mbyll'
    },
    sr: {
      shareQuestionnaire: 'Подели упитник',
      shareWith: 'Подели са',
      copyLink: 'Копирај везу',
      linkCopied: 'Веза копирана!',
      downloadQR: 'Преузми QR код',
      showQR: 'Прикажи QR код',
      hideQR: 'Сакриј QR код',
      shareVia: 'Подели преко',
      email: 'Е-пошта',
      whatsApp: 'WhatsApp',
      viber: 'Viber',
      telegram: 'Telegram',
      messenger: 'Messenger',
      native: 'Више опција',
      qrCodeTitle: 'QR Код',
      qrCodeDescription: 'Скенирајте овај код да приступите упитнику',
      close: 'Затвори'
    }
  };

  const tr = (key: keyof typeof translations.en) => translations[language][key];

  if (!isOpen) return null;

  // Generate the full URL for the questionnaire
  const questionnaireUrl = `${window.location.origin}/questionnaire/${questionnaireId}`;

  // Share text for social media
  const shareText = `${questionnaireTitle} - ${tr('shareQuestionnaire')}`;

  // Copy to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(questionnaireUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = questionnaireUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Native Web Share API (modern browsers, especially mobile)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: questionnaireTitle,
          text: shareText,
          url: questionnaireUrl
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      alert('Web Share API is not supported in your browser');
    }
  };

  // Email sharing
  const handleEmailShare = () => {
    const subject = encodeURIComponent(questionnaireTitle);
    const body = encodeURIComponent(`${shareText}\n\n${questionnaireUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  // WhatsApp sharing
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${shareText}\n${questionnaireUrl}`);
    // Use api.whatsapp.com for desktop, wa.me for mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const whatsappUrl = isMobile
      ? `whatsapp://send?text=${text}`
      : `https://web.whatsapp.com/send?text=${text}`;
    window.open(whatsappUrl, '_blank');
  };

  // Viber sharing
  const handleViberShare = () => {
    const text = encodeURIComponent(`${shareText}\n${questionnaireUrl}`);
    window.open(`viber://forward?text=${text}`, '_blank');
  };

  // Telegram sharing
  const handleTelegramShare = () => {
    const text = encodeURIComponent(shareText);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(questionnaireUrl)}&text=${text}`, '_blank');
  };

  // Messenger sharing
  const handleMessengerShare = () => {
    window.open(`fb-messenger://share?link=${encodeURIComponent(questionnaireUrl)}`, '_blank');
  };

  // Download QR Code
  const handleDownloadQR = () => {
    const svg = qrCodeRef.current?.querySelector('svg');
    if (!svg) return;

    // Convert SVG to canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `questionnaire-${questionnaireId}-qr.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const shareButtons = [
    {
      name: tr('email'),
      icon: <Mail className="w-5 h-5" />,
      onClick: handleEmailShare,
      color: 'bg-gray-600 hover:bg-gray-700',
      available: true
    },
    {
      name: tr('whatsApp'),
      icon: <MessageCircle className="w-5 h-5" />,
      onClick: handleWhatsAppShare,
      color: 'bg-green-600 hover:bg-green-700',
      available: true
    },
    {
      name: tr('viber'),
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.398.002C9.473.028 5.331.344 3.014 2.467 1.294 4.177.693 6.698.623 9.82c-.06 3.11-.13 8.95 5.5 10.541v2.42s-.038.97.602 1.17c.79.25 1.24-.499 1.99-1.299l1.4-1.58c3.85.32 6.8-.419 7.14-.529.78-.25 5.181-.811 5.901-6.652.74-6.031-.36-9.831-2.34-11.551l-.01-.002c-.6-.55-3-2.3-8.37-2.32 0 0-.396-.025-1.038-.016zm.067 1.697c.545-.003.88.02.88.02 4.54.01 6.711 1.38 7.221 1.84 1.67 1.429 2.528 4.856 1.9 9.892-.6 4.88-4.17 5.19-4.83 5.4-.28.09-2.88.73-6.152.52 0 0-2.439 2.941-3.199 3.701-.12.13-.26.17-.35.15-.13-.03-.17-.19-.16-.41l.02-4.019c-4.771-1.32-4.491-6.302-4.441-8.902.06-2.6.55-4.732 2-6.152 1.957-1.77 5.475-2.01 7.11-2.03z"/>
        </svg>
      ),
      onClick: handleViberShare,
      color: 'bg-purple-600 hover:bg-purple-700',
      available: true
    },
    {
      name: tr('telegram'),
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.84 8.673c-.137.623-.5.776-.99.483l-2.738-2.02-1.32 1.27c-.146.146-.27.27-.552.27l.197-2.8 5.09-4.597c.22-.197-.048-.308-.342-.11l-6.29 3.96-2.71-.844c-.59-.184-.602-.59.124-.876l10.6-4.088c.493-.182.923.11.762.874z"/>
        </svg>
      ),
      onClick: handleTelegramShare,
      color: 'bg-blue-500 hover:bg-blue-600',
      available: true
    },
    {
      name: tr('messenger'),
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
        </svg>
      ),
      onClick: handleMessengerShare,
      color: 'bg-blue-600 hover:bg-blue-700',
      available: true
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Share2 className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">{tr('shareQuestionnaire')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={tr('close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Questionnaire Title */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-purple-900">{questionnaireTitle}</p>
          </div>

          {/* Copy Link Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {tr('copyLink')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={questionnaireUrl}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    {tr('linkCopied')}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    {tr('copyLink')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          <div>
            <button
              onClick={() => setShowQRCode(!showQRCode)}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <QrCodeIcon className="w-6 h-6 text-purple-600" />
                <span className="font-semibold text-purple-900">
                  {showQRCode ? tr('hideQR') : tr('showQR')}
                </span>
              </div>
              <svg
                className={`w-5 h-5 text-purple-600 transform transition-transform ${
                  showQRCode ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showQRCode && (
              <div className="mt-4 p-6 bg-white border-2 border-purple-200 rounded-lg">
                <div ref={qrCodeRef} className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-inner">
                    <QRCodeSVG
                      value={questionnaireUrl}
                      size={200}
                      level="H"
                      includeMargin={true}
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                  <p className="text-sm text-gray-600 text-center">{tr('qrCodeDescription')}</p>
                  <button
                    onClick={handleDownloadQR}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {tr('downloadQR')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Social Share Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {tr('shareVia')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {shareButtons.map((button) => (
                <button
                  key={button.name}
                  onClick={button.onClick}
                  className={`${button.color} text-white px-4 py-3 rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-md`}
                >
                  {button.icon}
                  <span className="text-sm">{button.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Native Share (if supported) */}
          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Share2 className="w-5 h-5" />
              {tr('native')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;

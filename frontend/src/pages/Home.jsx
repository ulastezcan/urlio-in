import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [stats] = useState({
    links: 125000,
    clicks: 4500000,
    countries: 180
  });

  // Update document title and lang attribute based on current language
  useEffect(() => {
    document.documentElement.lang = i18n.language;
    const titles = {
      en: 'urlio.in - Smart URL Shortener with Analytics & QR Codes | Free Link Management',
      tr: 'urlio.in - Analitik ve QR Kodlu Akıllı URL Kısaltıcı | Ücretsiz Link Yönetimi'
    };
    const descriptions = {
      en: 'Create short, trackable links with real-time analytics, QR codes, and geo-targeting. Free URL shortener for marketers, businesses, and creators.',
      tr: 'Gerçek zamanlı analitik, QR kodlar ve coğrafi hedefleme ile kısa, takip edilebilir linkler oluşturun. Pazarlamacılar, işletmeler ve içerik üreticileri için ücretsiz URL kısaltıcı.'
    };
    document.title = titles[i18n.language] || titles.en;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', descriptions[i18n.language] || descriptions.en);
    }
  }, [i18n.language]);

  const features = [
    {
      icon: '🔗',
      titleKey: 'home.features.shortLinks.title',
      descKey: 'home.features.shortLinks.desc'
    },
    {
      icon: '📊',
      titleKey: 'home.features.analytics.title',
      descKey: 'home.features.analytics.desc'
    },
    {
      icon: '🌍',
      titleKey: 'home.features.geo.title',
      descKey: 'home.features.geo.desc'
    },
    {
      icon: '📱',
      titleKey: 'home.features.qr.title',
      descKey: 'home.features.qr.desc'
    },
    {
      icon: '⚡',
      titleKey: 'home.features.fast.title',
      descKey: 'home.features.fast.desc'
    },
    {
      icon: '🔒',
      titleKey: 'home.features.secure.title',
      descKey: 'home.features.secure.desc'
    }
  ];

  const useCases = [
    {
      icon: '📱',
      titleKey: 'home.useCases.social.title',
      descKey: 'home.useCases.social.desc'
    },
    {
      icon: '📧',
      titleKey: 'home.useCases.email.title',
      descKey: 'home.useCases.email.desc'
    },
    {
      icon: '🎯',
      titleKey: 'home.useCases.marketing.title',
      descKey: 'home.useCases.marketing.desc'
    },
    {
      icon: '📈',
      titleKey: 'home.useCases.business.title',
      descKey: 'home.useCases.business.desc'
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden" aria-label="Hero section">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-70"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              {t('home.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {t('home.hero.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                {t('home.hero.cta.start')}
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
              >
                {t('home.hero.cta.login')}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto mt-16">
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {stats.links.toLocaleString()}+
                </div>
                <div className="text-gray-600">{t('home.stats.links')}</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {stats.clicks.toLocaleString()}+
                </div>
                <div className="text-gray-600">{t('home.stats.clicks')}</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {stats.countries}+
                </div>
                <div className="text-gray-600">{t('home.stats.countries')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white" id="features" aria-labelledby="features-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="features-heading" className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('home.features.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('home.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="list">
            {features.map((feature, index) => (
              <article
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-8 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                role="listitem"
              >
                <div className="text-5xl mb-4" aria-hidden="true">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t(feature.descKey)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white" id="how-it-works" aria-labelledby="how-it-works-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="how-it-works-heading" className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('home.howItWorks.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('home.howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12" role="list">
            <article className="text-center" role="listitem">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6" aria-hidden="true">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {t('home.howItWorks.step1.title')}
              </h3>
              <p className="text-gray-600">
                {t('home.howItWorks.step1.desc')}
              </p>
            </article>

            <article className="text-center" role="listitem">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6" aria-hidden="true">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {t('home.howItWorks.step2.title')}
              </h3>
              <p className="text-gray-600">
                {t('home.howItWorks.step2.desc')}
              </p>
            </article>

            <article className="text-center" role="listitem">
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6" aria-hidden="true">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {t('home.howItWorks.step3.title')}
              </h3>
              <p className="text-gray-600">
                {t('home.howItWorks.step3.desc')}
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-white" id="use-cases" aria-labelledby="use-cases-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="use-cases-heading" className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('home.useCases.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('home.useCases.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" role="list">
            {useCases.map((useCase, index) => (
              <article
                key={index}
                className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100 hover:shadow-lg transition-all duration-300"
                role="listitem"
              >
                <div className="text-4xl mb-4" aria-hidden="true">{useCase.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {t(useCase.titleKey)}
                </h3>
                <p className="text-gray-600">
                  {t(useCase.descKey)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('home.cta.title')}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            {t('home.cta.subtitle')}
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-10 py-5 bg-white text-blue-600 text-lg font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-xl hover:shadow-2xl"
          >
            {t('home.cta.button')}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">urlio.in</h3>
              <p className="text-gray-400">
                {t('home.footer.tagline')}
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('home.footer.product')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">{t('home.footer.features')}</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">{t('home.footer.pricing')}</a></li>
                <li><a href="#api" className="hover:text-white transition-colors">{t('home.footer.api')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('home.footer.resources')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#docs" className="hover:text-white transition-colors">{t('home.footer.docs')}</a></li>
                <li><a href="#help" className="hover:text-white transition-colors">{t('home.footer.help')}</a></li>
                <li><a href="#blog" className="hover:text-white transition-colors">{t('home.footer.blog')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('home.footer.company')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-white transition-colors">{t('home.footer.about')}</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">{t('home.footer.contact')}</a></li>
                <li><a href="#privacy" className="hover:text-white transition-colors">{t('home.footer.privacy')}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2025 urlio.in. {t('home.footer.rights')}</p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Home;

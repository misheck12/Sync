/**
 * SYNC SCHOOL MANAGEMENT SYSTEM - WEBSITE
 * Interactive JavaScript - Enhanced & Responsive
 */

const API_BASE_URL = (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:'  // For local file testing
)
    ? 'http://localhost:4001/api/v1'
    : '/api/v1';

// The pricing policy is served by this workspace's backend. The existing
// contact/signup flows still use their separate CRM backend in local preview.
const PRICING_API_BASE_URL = (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:'
)
    ? 'http://localhost:4000/api/v1'
    : '/api/v1';

let userCurrency = 'ZMW'; // Default to Zambian Kwacha
let userCountry = 'ZM';

function notifyCurrencyChange() {
    document.dispatchEvent(new CustomEvent('sync:currency-changed', {
        detail: { currency: userCurrency, country: userCountry }
    }));
}
document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // NAVBAR SCROLL EFFECT
    // ==========================================
    const navbar = document.getElementById('navbar');

    const handleScroll = () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    // ==========================================
    // MOBILE MENU TOGGLE
    // ==========================================
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            mobileMenu.classList.toggle('active');

            // Prevent body scroll when menu is open
            if (mobileMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        // Close menu when clicking on links
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // ==========================================
    // SMOOTH SCROLLING FOR ANCHOR LINKS
    // ==========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const navHeight = navbar.offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ==========================================
    // MODULE TABS SWITCHING
    // ==========================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const modulePanels = document.querySelectorAll('.module-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;

            // Remove active from all
            tabBtns.forEach(b => b.classList.remove('active'));
            modulePanels.forEach(p => p.classList.remove('active'));

            // Add active to clicked
            btn.classList.add('active');
            const targetPanel = document.getElementById(`${tabId}-panel`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });

    // ==========================================
    // FAQ ACCORDION
    // ==========================================
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');

                // Close all other FAQ items
                faqItems.forEach(other => {
                    if (other !== item) {
                        other.classList.remove('active');
                        other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
                    }
                });

                // Toggle current item
                item.classList.toggle('active', !isActive);
                question.setAttribute('aria-expanded', !isActive);
            });
        }
    });

    // ==========================================
    // DYNAMIC PRICING FROM API
    // ==========================================
    const loadPricing = async () => {
        const pricingGrid = document.getElementById('pricing-grid');
        if (!pricingGrid) return;
        document.getElementById('pricing-fallback')?.remove();
        notifyCurrencyChange();

        try {
            const response = await fetch(`${PRICING_API_BASE_URL}/website/pricing`);

            if (!response.ok) {
                throw new Error('Failed to fetch pricing');
            }

            const data = await response.json();

            // The existing production backend returns admin-created plans with
            // fixed monthly prices; it does not have active-student billing.
            if (data.success === true && data.currency?.primary === 'ZMW'
                && Array.isArray(data.plans) && data.plans.length > 0 && data.plans.length <= 16) {
                const cards = data.plans.map(createAdminPricingCard);
                pricingGrid.classList.toggle('pricing-grid--legacy', cards.length === 1);
                pricingGrid.replaceChildren(...cards);
                document.getElementById('pricing-estimator').hidden = true;
                document.getElementById('pricing-estimate-hint').hidden = true;
                document.getElementById('pricing-description').textContent = 'Explore the plans published by our team, then ask for a confirmed school quote.';
                document.getElementById('pricing-policy-note').textContent = 'Published monthly prices are indicative; eligibility and any additional charges are confirmed with your school.';
                return;
            }

            if (!data.success || data.currency !== 'ZMW' || data.billingBasis !== 'ACTIVE_STUDENTS'
                || !Array.isArray(data.plans) || data.plans.length !== 4) throw new Error('Pricing data is unavailable');

            const expected = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
            if (!expected.every(plan => data.plans.some(item => item.plan === plan))) throw new Error('Incomplete pricing data');

            const studentsInput = document.getElementById('pricing-student-count');
            const estimator = document.getElementById('pricing-estimator');
            if (!studentsInput || !estimator) throw new Error('Pricing controls are missing');
            document.getElementById('pricing-description').textContent = 'Pay for active students, not empty seats. Explore a plan, then speak to our team for your school\'s confirmed quote.';
            const render = () => {
                const activeStudents = Math.min(100000, Math.max(1, Number(studentsInput.value) || 100));
                pricingGrid.replaceChildren(...expected.map(tier => createPricingCard(
                    data.plans.find(item => item.plan === tier), data, activeStudents
                )));
                document.getElementById('pricing-estimate-count').textContent = activeStudents.toLocaleString('en-ZM');
            };
            studentsInput.addEventListener('input', render);
            estimator.hidden = false;
            document.getElementById('pricing-estimate-hint').hidden = false;
            const annualDiscount = Number(data.annualDiscountPercent);
            document.getElementById('pricing-policy-note').textContent = annualDiscount > 0 && annualDiscount <= 100
                ? `Annual billing may receive a ${formatPrice(annualDiscount)}% discount on recurring charges, subject to the monthly minimum. Setup fees and usage overages are separate.`
                : 'Monthly minimums apply. Setup fees, support tiers and usage overages are confirmed with your school.';
            render();
        } catch (error) {
            console.warn('Could not load current school pricing:', error.message);
            document.getElementById('pricing-estimator').hidden = true;
            document.getElementById('pricing-estimate-hint').hidden = true;
            const message = document.createElement('div');
            message.className = 'pricing-unavailable';
            const heading = document.createElement('h3');
            heading.textContent = 'Pricing is temporarily unavailable';
            const detail = document.createElement('p');
            detail.textContent = 'We will help you find the right fit. Ask our team for the latest confirmed pricing.';
            const contact = document.createElement('a');
            contact.className = 'btn btn-primary';
            contact.href = 'https://wa.me/260960231978?text=Hello%20Sync%2C%20please%20send%20me%20your%20latest%20school%20pricing.';
            contact.target = '_blank';
            contact.rel = 'noopener noreferrer';
            contact.textContent = 'Request current pricing';
            message.append(heading, detail, contact);
            pricingGrid.replaceChildren(message);
        }
    };

    loadPricing();

    // ==========================================
    // CONTACT FORM SUBMISSION
    // ==========================================
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Get form data
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            // Simple validation
            if (!data.name || !data.email || !data.message) {
                showNotification('Please fill in all required fields.', 'error');
                return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) {
                showNotification('Please enter a valid email address.', 'error');
                return;
            }

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            try {
                const response = await fetch(`${API_BASE_URL}/website/contact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    showNotification('Thank you! We\'ll be in touch shortly.', 'success');
                    contactForm.reset();

                    // Show in-form success state
                    contactForm.classList.add('submitted');
                    contactForm.style.position = 'relative';
                    const successOverlay = document.createElement('div');
                    successOverlay.className = 'form-success-overlay';
                    successOverlay.innerHTML = `
                        <div class="form-success-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <h3>Message Sent!</h3>
                        <p>We'll get back to you within 24 hours. Check your email or WhatsApp.</p>
                        <button class="btn btn-primary" onclick="this.parentElement.remove(); document.getElementById('contact-form').classList.remove('submitted');">Send Another Message</button>
                    `;
                    contactForm.appendChild(successOverlay);
                } else {
                    showNotification(result.error || 'Failed to send message. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Contact form error:', error);
                showNotification('Network error. Please try again later.', 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }




    // ==========================================
    // NOTIFICATION SYSTEM
    // ==========================================
    function showNotification(message, type = 'success') {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Styles
        Object.assign(notification.style, {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            left: window.innerWidth <= 480 ? '24px' : 'auto',
            padding: '16px 24px',
            borderRadius: '12px',
            background: type === 'success' ? '#10B981' : '#EF4444',
            color: 'white',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: '9999',
            animation: 'slideIn 0.3s ease',
            fontSize: '14px'
        });

        // Add animation keyframes
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        Object.assign(closeBtn.style, {
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '0',
            lineHeight: '1'
        });

        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        });

        // Auto-dismiss
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    // ==========================================
    // INTERSECTION OBSERVER FOR ANIMATIONS
    // ==========================================
    const animateOnScroll = () => {
        // Pricing can arrive asynchronously; never hide purchase information
        // behind an observer that may not fire in a background tab.
        const elements = document.querySelectorAll('.feature-card, .testimonial-card');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Stagger animation
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 100);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        elements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    };

    // Run after a small delay to ensure elements are rendered
    setTimeout(animateOnScroll, 100);

    // ==========================================
    // STATS COUNTER ANIMATION
    // ==========================================
    const animateCounters = () => {
        const counters = document.querySelectorAll('.stat-value');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const text = target.textContent;
                    const match = text.match(/[\d.]+/);

                    if (match) {
                        const endValue = parseFloat(match[0].replace(',', ''));
                        const suffix = text.replace(/[\d.,]+/, '');
                        const duration = 2000;
                        const startTime = performance.now();

                        const animate = (currentTime) => {
                            const elapsed = currentTime - startTime;
                            const progress = Math.min(elapsed / duration, 1);

                            // Easing function
                            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                            const currentValue = easeOutQuart * endValue;

                            // Format based on original format
                            if (text.includes('K')) {
                                target.textContent = `${Math.floor(currentValue)}K${suffix.replace('K', '')}`;
                            } else if (text.includes('%')) {
                                target.textContent = `${currentValue.toFixed(1)}%`;
                            } else if (text.includes('+')) {
                                target.textContent = `${Math.floor(currentValue)}+`;
                            } else {
                                target.textContent = `${Math.floor(currentValue)}${suffix}`;
                            }

                            if (progress < 1) {
                                requestAnimationFrame(animate);
                            } else {
                                target.textContent = text; // Restore original
                            }
                        };

                        requestAnimationFrame(animate);
                    }

                    observer.unobserve(target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => observer.observe(counter));
    };

    animateCounters();

    // ==========================================
    // PARALLAX EFFECT FOR HERO (Desktop Only)
    // ==========================================
    if (window.innerWidth > 1024) {
        const dashboardPreview = document.querySelector('.dashboard-preview');
        const floatingCards = document.querySelectorAll('.floating-card');

        if (dashboardPreview) {
            window.addEventListener('mousemove', (e) => {
                const x = (e.clientX / window.innerWidth - 0.5) * 20;
                const y = (e.clientY / window.innerHeight - 0.5) * 20;

                dashboardPreview.style.transform = `rotateY(${-5 + x * 0.5}deg) rotateX(${2 + y * 0.3}deg)`;

                floatingCards.forEach((card, index) => {
                    const factor = (index + 1) * 0.3;
                    card.style.transform = `translateY(${Math.sin(Date.now() / 1000 + index) * 10}px) translateX(${x * factor}px)`;
                });
            });
        }
    }

    // ==========================================
    // RESIZE HANDLER
    // ==========================================
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Close mobile menu on resize to desktop
            if (window.innerWidth > 768 && mobileMenu) {
                mobileMenuBtn.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        }, 250);
    });

    // ==========================================
    // ACTIVE NAV LINK ON SCROLL
    // ==========================================
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');

    const updateActiveLink = () => {
        const scrollPosition = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };

    window.addEventListener('scroll', updateActiveLink);

    console.log('Sync Website loaded successfully.');
});

// ==========================================
// PRELOADER (Optional - add to HTML if needed)
// ==========================================
window.addEventListener('load', () => {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => preloader.remove(), 300);
    }
});

// ==========================================
// DYNAMIC PRICING FUNCTIONS
// ==========================================

/**
 * Get display symbol for a currency code
 */
function getCurrencySymbol(currency) {
    return currency === 'USD' ? '$' : 'K';
}

/**
 * Format price with currency symbol
 */
function formatPriceWithCurrency(amount, currency) {
    if (amount === 0 || amount === 'Custom') return 'Custom';
    const symbol = getCurrencySymbol(currency || userCurrency);
    return `${symbol}${new Intl.NumberFormat('en-ZM').format(amount)}`;
}

/**
 * Format price with thousands separator
 */
function formatPrice(amount) {
    if (amount === 'Custom') return 'Custom';
    return new Intl.NumberFormat('en-ZM', { maximumFractionDigits: 2 }).format(Number(amount) || 0);
}

const PLAN_LABELS = {
    FREE: { name: 'Free', description: 'Explore what Sync can do for your school.', audience: 'Explore the platform' },
    STARTER: { name: 'Starter', description: 'A straightforward way to get your school in sync.', audience: 'Getting started' },
    PROFESSIONAL: { name: 'Professional', description: 'More room for growing school operations.', audience: 'Growing schools' },
    ENTERPRISE: { name: 'Enterprise', description: 'For organisations needing a tailored rollout.', audience: 'Larger operations' }
};

function createAdminPricingCard(plan) {
    const name = plan && typeof plan.name === 'string' ? plan.name.trim() : '';
    const amount = plan?.price?.monthly?.zmw;
    if (!name || name.length > 80 || typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
        throw new Error('Invalid published plan');
    }

    const card = document.createElement('article');
    card.className = 'pricing-card pricing-card--live';
    const header = document.createElement('div');
    header.className = 'pricing-card__header';
    const eyebrow = document.createElement('span');
    eyebrow.className = 'pricing-card__audience';
    eyebrow.textContent = 'Published plan';
    const title = document.createElement('h3');
    title.textContent = name;
    const description = document.createElement('p');
    description.className = 'pricing-card__description';
    description.textContent = typeof plan.description === 'string' ? plan.description.slice(0, 300) : 'Speak to our team about this plan.';
    header.append(eyebrow, title, description);

    const price = document.createElement('div');
    price.className = 'pricing-card__rate';
    const value = document.createElement('strong');
    value.textContent = `ZMW ${formatPrice(amount)}`;
    const period = document.createElement('span');
    period.textContent = 'published monthly price';
    price.append(value, period);

    const facts = document.createElement('ul');
    facts.className = 'pricing-card__facts';
    const studentLimit = plan.limits?.students;
    if (typeof studentLimit === 'number' && Number.isSafeInteger(studentLimit) && studentLimit > 0) {
        const item = document.createElement('li');
        item.textContent = `Up to ${formatPrice(studentLimit)} students`;
        facts.append(item);
    }

    const cta = document.createElement('a');
    cta.className = 'btn btn-primary btn-block';
    cta.href = `https://wa.me/260960231978?text=${encodeURIComponent(`Hello Sync, please tell me about the ${name} plan.`)}`;
    cta.target = '_blank';
    cta.rel = 'noopener noreferrer';
    cta.textContent = 'Discuss this plan';
    const note = document.createElement('small');
    note.className = 'pricing-card__disclaimer';
    note.textContent = 'Ask for a confirmed quote before subscribing.';
    card.append(header, price, facts, cta, note);
    return card;
}

function createPricingCard(plan, policy, activeStudents) {
    const labels = PLAN_LABELS[plan.plan];
    const rate = Number(plan.pricePerActiveStudent);
    const minimum = Number(plan.minimumMonthlyBill);
    const setup = Number(plan.setupFeeAmount);
    const support = Number(policy.supportFeeBasic);
    const aiUnits = Number(plan.aiIncludedUnits);
    const smsUnits = Number(plan.smsIncludedUnits);
    if (!labels || [rate, minimum, setup, support, aiUnits, smsUnits].some(value => !Number.isFinite(value) || value < 0)) {
        throw new Error('Invalid pricing policy');
    }

    const free = plan.plan === 'FREE';
    const recommended = plan.plan === 'PROFESSIONAL';
    // Illustration only: actual invoices use verified ACTIVE students, support tier,
    // operator-approved custom rates, overages, annual policy and setup history.
    const monthlyIllustration = free ? 0 : Math.max(activeStudents * rate + support, minimum);
    const card = document.createElement('article');
    card.className = `pricing-card pricing-card--live tier-${plan.plan.toLowerCase()}${recommended ? ' popular' : ''}`;

    const eyebrow = document.createElement('span');
    eyebrow.className = 'pricing-card__audience';
    eyebrow.textContent = labels.audience;
    const title = document.createElement('h3');
    title.textContent = labels.name;
    const description = document.createElement('p');
    description.className = 'pricing-card__description';
    description.textContent = labels.description;
    const header = document.createElement('div');
    header.className = 'pricing-card__header';
    header.append(eyebrow, title, description);
    if (recommended) {
        const badge = document.createElement('span');
        badge.className = 'pricing-card__badge';
        badge.textContent = 'Recommended';
        card.append(badge);
    }

    const price = document.createElement('div');
    price.className = 'pricing-card__rate';
    const priceValue = document.createElement('strong');
    priceValue.textContent = free ? 'Free' : `ZMW ${formatPrice(rate)}`;
    const rateLabel = document.createElement('span');
    rateLabel.textContent = free ? 'No subscription charge' : 'per active student / month';
    price.append(priceValue, rateLabel);

    const illustration = document.createElement('div');
    illustration.className = 'pricing-card__estimate';
    const exampleLabel = document.createElement('span');
    exampleLabel.textContent = free ? 'Monthly subscription' : `Illustration for ${formatPrice(activeStudents)} active students`;
    const examplePrice = document.createElement('strong');
    examplePrice.textContent = `ZMW ${formatPrice(monthlyIllustration)} / month`;
    illustration.append(exampleLabel, examplePrice);

    const facts = document.createElement('ul');
    facts.className = 'pricing-card__facts';
    const items = free
        ? [`${formatPrice(aiUnits)} AI requests included`, `${formatPrice(smsUnits)} messages included`, 'No setup fee']
        : [`Monthly minimum: ZMW ${formatPrice(minimum)}`, `One-time setup: ZMW ${formatPrice(setup)}`, `${formatPrice(aiUnits)} AI requests included`, `${formatPrice(smsUnits)} messages included`];
    if (!free && plan.setupFeeWaivedOnAnnual) items.push('Setup fee waived on annual billing');
    items.forEach(text => {
        const item = document.createElement('li');
        const check = document.createElement('span');
        check.setAttribute('aria-hidden', 'true');
        check.textContent = '✓';
        item.append(check, document.createTextNode(text));
        facts.append(item);
    });

    const cta = document.createElement('a');
    cta.className = recommended ? 'btn btn-primary btn-block' : 'btn btn-outline btn-block';
    cta.href = `https://wa.me/260960231978?text=${encodeURIComponent(`Hello Sync, please advise on the ${labels.name} plan for a school with approximately ${activeStudents} active students.`)}`;
    cta.target = '_blank';
    cta.rel = 'noopener noreferrer';
    cta.textContent = free ? 'Ask about Free' : plan.plan === 'ENTERPRISE' ? 'Talk to sales' : 'Discuss this plan';
    const footnote = document.createElement('small');
    footnote.className = 'pricing-card__disclaimer';
    footnote.textContent = free ? 'Subject to plan eligibility.' : 'Estimate includes Basic support; excludes setup and usage overages.';

    card.append(header, price, illustration, facts, cta, footnote);
    return card;
}

// ==========================================
// IMAGE LIGHTBOX
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('lightbox-overlay');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.getElementById('lightbox-close');

    if (!overlay) return;

    // Open lightbox on showcase item click
    document.querySelectorAll('[data-lightbox]').forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            const src = item.dataset.lightbox;
            const caption = item.dataset.caption || '';
            lightboxImg.src = src;
            lightboxImg.alt = caption;
            lightboxCaption.textContent = caption;
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    // Close lightbox
    const closeLightbox = () => {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => { lightboxImg.src = ''; }, 300);
    };

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeLightbox();
    });
});

// ==========================================
// BACK TO TOP BUTTON
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const backToTop = document.getElementById('back-to-top');
    if (!backToTop) return;

    const toggleBackToTop = () => {
        if (window.scrollY > 600) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    };

    window.addEventListener('scroll', toggleBackToTop, { passive: true });
    toggleBackToTop();

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

// ==========================================
// COOKIE CONSENT BANNER
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const banner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('cookie-accept');
    const declineBtn = document.getElementById('cookie-decline');

    if (!banner) return;

    // Check if user already made a choice
    const cookieChoice = localStorage.getItem('sync-cookie-consent');
    if (cookieChoice) return;

    // Show banner after a short delay
    setTimeout(() => {
        banner.classList.add('visible');
    }, 2000);

    const hideBanner = (choice) => {
        localStorage.setItem('sync-cookie-consent', choice);
        banner.classList.remove('visible');
    };

    if (acceptBtn) acceptBtn.addEventListener('click', () => hideBanner('accepted'));
    if (declineBtn) declineBtn.addEventListener('click', () => hideBanner('declined'));
});

// ==========================================
// ROI CALCULATOR
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const studentsSlider = document.getElementById('roi-students');
    const teachersSlider = document.getElementById('roi-teachers');
    const adminsSlider = document.getElementById('roi-admins');

    if (!studentsSlider || !teachersSlider || !adminsSlider) return;

    const studentsVal = document.getElementById('roi-students-val');
    const teachersVal = document.getElementById('roi-teachers-val');
    const adminsVal = document.getElementById('roi-admins-val');
    const hoursResult = document.getElementById('roi-hours');
    const moneyResult = document.getElementById('roi-money');
    const errorsResult = document.getElementById('roi-errors');

    const calculateROI = () => {
        const students = parseInt(studentsSlider.value);
        const teachers = parseInt(teachersSlider.value);
        const admins = parseInt(adminsSlider.value);

        // Update displayed values
        studentsVal.textContent = students.toLocaleString();
        teachersVal.textContent = teachers;
        adminsVal.textContent = admins;

        // Calculate savings
        // Teachers save ~5 hours/week on lesson planning + grading
        // Admins save ~15 hours/week on fee reconciliation + reports
        // More students = more admin overhead saved
        const teacherHours = teachers * 5 * 4; // per month
        const adminHours = admins * 15 * 4;
        const studentFactor = Math.min(students / 100, 10) * 2;
        const totalHours = Math.round(teacherHours + adminHours + studentFactor);

        // Money saved - adjust for currency
        // ZMW 75/hour for Zambia, $3/hour USD equivalent
        const hourlyRate = userCurrency === 'USD' ? 3 : 75;
        const moneySaved = Math.round(totalHours * hourlyRate / 100) * 100;
        const currencySymbol = getCurrencySymbol(userCurrency);

        // Error reduction (more students = bigger impact)
        const errorReduction = Math.min(88 + Math.floor(students / 300) * 2, 99);

        hoursResult.textContent = totalHours.toLocaleString();
        moneyResult.textContent = `${currencySymbol} ${moneySaved.toLocaleString()}`;
        errorsResult.textContent = `${errorReduction}%`;
    };

    studentsSlider.addEventListener('input', calculateROI);
    teachersSlider.addEventListener('input', calculateROI);
    adminsSlider.addEventListener('input', calculateROI);

    // Initial calculation
    calculateROI();
    document.addEventListener('sync:currency-changed', calculateROI);
});

// ==========================================
// MOBILE FOOTER ACCORDION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth > 768) return;

    const footerSections = document.querySelectorAll('.footer-links, .footer-contact-col');

    footerSections.forEach(section => {
        const heading = section.querySelector('h4');
        if (!heading) return;

        heading.addEventListener('click', () => {
            // Close others
            footerSections.forEach(other => {
                if (other !== section) other.classList.remove('expanded');
            });
            // Toggle current
            section.classList.toggle('expanded');
        });
    });
});

// ==========================================
// MODULE TAB IMAGE PRELOADING
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Preload module images for smoother tab transitions
    const moduleImages = [
        'img/finance_ai_dashboard_8k_mockup.png',
        'img/teacherAIMockup.png',
        'img/parentuimockup.png',
        'img/virtualclassmockup.png'
    ];

    moduleImages.forEach(src => {
        const img = new Image();
        img.src = src;
    });
});

// ==========================================
// SIGNUP / CHECKOUT MODAL
// ==========================================
let selectedPlan = null;
let billingCycle = 'monthly';

/**
 * Called when user clicks "Get Started" on a pricing card
 */
function selectPlan(plan) {
    selectedPlan = plan;
    billingCycle = 'monthly';

    const overlay = document.getElementById('signup-overlay');
    if (!overlay) return;

    // Reset to step 1
    showSignupStep(1);

    // Get currency symbol
    const currencySymbol = getCurrencySymbol(plan.currency || userCurrency);

    // Update plan bar
    document.getElementById('plan-bar-name').textContent = plan.name + ' Plan';
    document.getElementById('plan-bar-price').textContent = `${currencySymbol} ${formatPrice(plan.priceMonthly)}/mo`;

    // Update order summary
    updateOrderSummary();

    // Show modal
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus first input
    setTimeout(() => {
        const firstInput = document.getElementById('signup-school');
        if (firstInput) firstInput.focus();
    }, 400);
}

function showSignupStep(step) {
    // Hide all panels
    document.querySelectorAll('.signup-panel').forEach(p => {
        p.classList.remove('active');
        p.style.display = '';
    });

    // Show target panel
    const panel = document.getElementById(`signup-step-${step}`);
    if (panel) {
        panel.classList.add('active');
    }

    // Update step indicators
    document.querySelectorAll('.signup-step').forEach(s => {
        const sStep = parseInt(s.dataset.step);
        s.classList.remove('active', 'completed');
        if (sStep === step) s.classList.add('active');
        else if (sStep < step) s.classList.add('completed');
    });

    // Update step lines
    const lines = document.querySelectorAll('.step-line');
    lines.forEach((line, i) => {
        line.classList.toggle('active', i < step - 1);
    });
}

function updateOrderSummary() {
    if (!selectedPlan) return;

    const price = billingCycle === 'yearly' ? selectedPlan.priceYearly : selectedPlan.priceMonthly;
    const periodLabel = billingCycle === 'yearly' ? 'Billed yearly' : 'Billed monthly';
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'mobile_money';
    const isFreeTrial = paymentMethod === 'pay_later';
    const currencySymbol = getCurrencySymbol(selectedPlan.currency || userCurrency);

    document.getElementById('order-plan-name').textContent = selectedPlan.name + ' Plan';
    document.getElementById('order-plan-price').textContent = `${currencySymbol} ${formatPrice(price)}`;
    document.getElementById('order-period-label').textContent = periodLabel;
    document.getElementById('order-total').textContent = isFreeTrial ? `${currencySymbol} 0` : `${currencySymbol} ${formatPrice(price)}`;

    // Show/hide trial note
    const trialNote = document.getElementById('order-trial-note');
    if (trialNote) {
        trialNote.style.display = isFreeTrial ? 'flex' : 'none';
    }

    // Show/hide mobile money details
    const mmDetails = document.getElementById('mobile-money-details');
    if (mmDetails) {
        mmDetails.style.display = paymentMethod === 'mobile_money' ? 'block' : 'none';
    }

    // Update plan bar price
    const suffix = billingCycle === 'yearly' ? '/yr' : '/mo';
    document.getElementById('plan-bar-price').textContent = `${currencySymbol} ${formatPrice(price)}${suffix}`;
}

function populateReview() {
    const school = document.getElementById('signup-school').value;
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const phone = document.getElementById('signup-phone').value;
    const students = document.getElementById('signup-students').value;
    const location = document.getElementById('signup-location').value;
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'mobile_money';
    const price = billingCycle === 'yearly' ? selectedPlan.priceYearly : selectedPlan.priceMonthly;
    const isFreeTrial = paymentMethod === 'pay_later';
    const currencySymbol = getCurrencySymbol(selectedPlan.currency || userCurrency);

    const paymentLabels = {
        'mobile_money': 'Mobile Money (Airtel/MTN)',
        'bank_transfer': 'Bank Transfer',
        'pay_later': '30-Day Free Trial'
    };

    document.getElementById('review-school-details').innerHTML = `
        <div class="review-item"><span class="label">School</span><span class="value">${school}</span></div>
        <div class="review-item"><span class="label">Students</span><span class="value">${students}</span></div>
        <div class="review-item"><span class="label">Contact</span><span class="value">${name}</span></div>
        <div class="review-item"><span class="label">Email</span><span class="value">${email}</span></div>
        <div class="review-item"><span class="label">Phone</span><span class="value">${phone}</span></div>
        ${location ? `<div class="review-item"><span class="label">Location</span><span class="value">${location}</span></div>` : ''}
    `;

    document.getElementById('review-payment-details').innerHTML = `
        <div class="review-item"><span class="label">Plan</span><span class="value">${selectedPlan.name}</span></div>
        <div class="review-item"><span class="label">Billing</span><span class="value">${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}</span></div>
        <div class="review-item"><span class="label">Method</span><span class="value">${paymentLabels[paymentMethod]}</span></div>
        <div class="review-item"><span class="label">Amount</span><span class="value">${isFreeTrial ? `${currencySymbol} 0 (free trial)` : `${currencySymbol} ${formatPrice(price)}`}</span></div>
    `;
}

function validateStep1() {
    const required = ['signup-school', 'signup-students', 'signup-name', 'signup-email', 'signup-phone'];
    let valid = true;

    required.forEach(id => {
        const el = document.getElementById(id);
        if (!el || !el.value.trim()) {
            el.style.borderColor = '#EF4444';
            valid = false;
        } else {
            el.style.borderColor = '';
        }
    });

    // Email validation
    const emailEl = document.getElementById('signup-email');
    if (emailEl && emailEl.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
        emailEl.style.borderColor = '#EF4444';
        valid = false;
    }

    if (!valid) {
        showNotification('Please fill in all required fields.', 'error');
    }
    return valid;
}

async function submitSignup() {
    const submitBtn = document.getElementById('signup-submit');
    const originalContent = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner" style="width:20px;height:20px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.6s linear infinite;display:inline-block;"></span> Processing...';
    submitBtn.disabled = true;

    const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'mobile_money';
    const price = billingCycle === 'yearly' ? selectedPlan.priceYearly : selectedPlan.priceMonthly;
    const currency = selectedPlan.currency || userCurrency;

    const payload = {
        school: document.getElementById('signup-school').value.trim(),
        students: document.getElementById('signup-students').value,
        name: document.getElementById('signup-name').value.trim(),
        role: document.getElementById('signup-role').value,
        email: document.getElementById('signup-email').value.trim(),
        phone: document.getElementById('signup-phone').value.trim(),
        location: document.getElementById('signup-location').value.trim(),
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        planTier: selectedPlan.tier,
        billingCycle,
        paymentMethod,
        amount: paymentMethod === 'pay_later' ? 0 : price,
        currency: currency
    };

    try {
        const response = await fetch(`${API_BASE_URL}/website/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Show success step
            document.querySelectorAll('.signup-panel').forEach(p => {
                p.classList.remove('active');
                p.style.display = '';
            });
            const successPanel = document.getElementById('signup-step-success');
            successPanel.style.display = 'block';
            successPanel.classList.add('active');

            // Hide step indicators & plan bar on success
            document.querySelector('.signup-steps').style.display = 'none';
            document.querySelector('.signup-plan-bar').style.display = 'none';

            // Populate success details
            const paymentLabels = {
                'mobile_money': 'Mobile Money',
                'bank_transfer': 'Bank Transfer',
                'pay_later': 'Free Trial (30 days)'
            };
            document.getElementById('success-details').innerHTML = `
                <div class="success-detail-row"><span class="label">School</span><span class="value">${payload.school}</span></div>
                <div class="success-detail-row"><span class="label">Plan</span><span class="value">${payload.planName}</span></div>
                <div class="success-detail-row"><span class="label">Payment</span><span class="value">${paymentLabels[payload.paymentMethod]}</span></div>
                <div class="success-detail-row"><span class="label">Reference</span><span class="value">${result.referenceId || '-'}</span></div>
            `;

            // Reset form
            document.getElementById('signup-form').reset();
        } else {
            showNotification(result.error || 'Something went wrong. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('Network error. Please check your connection and try again.', 'error');
    } finally {
        submitBtn.innerHTML = originalContent;
        submitBtn.disabled = !document.getElementById('signup-terms').checked;
    }
}

// Wire up signup modal events
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('signup-overlay');
    if (!overlay) return;

    const closeModal = () => {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        // Reset state after animation
        setTimeout(() => {
            showSignupStep(1);
            document.querySelector('.signup-steps').style.display = '';
            document.querySelector('.signup-plan-bar').style.display = '';
        }, 300);
    };

    // Close buttons
    document.getElementById('signup-close').addEventListener('click', closeModal);
    document.getElementById('signup-cancel').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
    });

    // Step navigation
    document.getElementById('signup-next-1').addEventListener('click', () => {
        if (validateStep1()) {
            showSignupStep(2);
            updateOrderSummary();
        }
    });

    document.getElementById('signup-back-2').addEventListener('click', () => showSignupStep(1));

    document.getElementById('signup-next-2').addEventListener('click', () => {
        populateReview();
        showSignupStep(3);
    });

    document.getElementById('signup-back-3').addEventListener('click', () => showSignupStep(2));

    // Terms checkbox enables submit
    document.getElementById('signup-terms').addEventListener('change', (e) => {
        document.getElementById('signup-submit').disabled = !e.target.checked;
    });

    // Submit
    document.getElementById('signup-submit').addEventListener('click', submitSignup);

    // Payment method selection
    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            opt.querySelector('input[type="radio"]').checked = true;
            updateOrderSummary();
        });
    });

    // Billing cycle toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            billingCycle = btn.dataset.cycle;
            updateOrderSummary();
        });
    });

    // Also handle fallback pricing "Get Started" buttons
    document.querySelectorAll('.pricing-fallback .btn-block').forEach(btn => {
        if (btn.textContent.trim() === 'Get Started') {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const card = btn.closest('.pricing-card');
                const name = card.querySelector('h3').textContent;
                const amountText = card.querySelector('.amount').textContent.replace(/,/g, '');
                const price = parseInt(amountText) || 0;
                selectPlan({
                    id: null,
                    name: name,
                    tier: name.toUpperCase(),
                    priceMonthly: price,
                    priceYearly: Math.round(price * 10)
                });
            });
        }
    });
});
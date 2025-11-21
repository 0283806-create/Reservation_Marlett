import { useEffect, useState } from 'react';
import Hero from './components/Hero';
import { supabase } from './lib/supabaseClient';
import SuccessToast from './components/SuccessToast';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lbcaivpxzkcenfyxwydw.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiY2FpdnB4emtjZW5meXh3eWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMzYzOTgsImV4cCI6MjA3MzgxMjM5OH0.VmoBrs7k1XCvIQ34MycVf9hWUW8DpbPALxAjkIhcupo';

const MARLETT_WHATSAPP = '523319006852';

const ambientes = [
  { id: 'lobby', title: 'Lobby', description: 'Acceso elegante con iluminación cálida.', image: '/assets/IMG_7432.jpg' },
  { id: 'accesibilidad', title: 'Accesibilidad', description: 'Rampas y circulación cómoda para todos.', image: '/assets/IMG_7429.jpg' },
  { id: 'lounge', title: 'Lounge & Bar', description: 'Para convivios, cocteles y afters.', image: '/assets/IMG_7431.jpg' },
  { id: 'auditorio', title: 'Auditorio', description: 'Montaje tipo conferencia.', image: '/assets/IMG_7436.jpg' },
  { id: 'detalles', title: 'Detalles', description: 'Acabados contemporáneos.', image: '/assets/IMG_7434.jpg' },
  { id: 'salon', title: 'Sala Marlett', description: 'El lugar para tus celebraciones.', image: '/assets/IMG_7436.jpg' }
];

function App() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const listeners: Array<() => void> = [];
    const addListener = (
      target: EventTarget | null,
      type: string,
      handler: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ) => {
      if (!target) return;
      target.addEventListener(type, handler, options);
      listeners.push(() => target.removeEventListener(type, handler, options));
    };

    const THEME_KEY = 'marlett-theme';
    const body = document.body;
    const themeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('#themePicker .tbtn'));

    const applyTheme = (theme: string) => {
      body.className = theme;
      localStorage.setItem(THEME_KEY, theme);
    };

    const savedTheme = localStorage.getItem(THEME_KEY) || 'theme-altos';
    applyTheme(savedTheme);

    themeButtons.forEach((button) => {
      const handler = () => applyTheme(button.dataset.theme || 'theme-altos');
      addListener(button, 'click', handler);
    });

    /* Carrusel de ambientes */
    const track = document.querySelector<HTMLDivElement>('.ambientes-track');
    const slides = Array.from(document.querySelectorAll<HTMLDivElement>('.ambiente-item'));
    const dots = Array.from(document.querySelectorAll<HTMLButtonElement>('.ambientes-dots button'));
    const prevBtn = document.querySelector<HTMLButtonElement>('.amb-btn.prev');
    const nextBtn = document.querySelector<HTMLButtonElement>('.amb-btn.next');
    let current = 0;

    const goToSlide = (index: number) => {
      if (!track || !slides.length) return;
      const total = slides.length;
      if (index < 0) index = total - 1;
      if (index >= total) index = 0;
      current = index;
      const offset = -index * 100;
      track.style.transform = `translateX(${offset}%)`;
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === current);
      });
    };

    const handlePrev = () => goToSlide(current - 1);
    const handleNext = () => goToSlide(current + 1);

    addListener(prevBtn, 'click', handlePrev);
    addListener(nextBtn, 'click', handleNext);
    dots.forEach((dot, idx) => {
      const handler = () => goToSlide(idx);
      addListener(dot, 'click', handler);
    });

    const intervalId = slides.length ? window.setInterval(() => handleNext(), 6000) : undefined;
    goToSlide(0);

    /* Formulario */
    const form = document.getElementById('resForm') as HTMLFormElement | null;
    const previewBtn = document.getElementById('previewBtn');
    const previewEl = document.getElementById('preview');
    const ctaWapp = document.getElementById('ctaWapp');
    const navbarWapp = document.getElementById('navbarWapp');
    const errorPanel = document.getElementById('formError');

    const refreshChips = () => {
      document.querySelectorAll<HTMLElement>('.chip').forEach((chip) => {
        const input = chip.querySelector<HTMLInputElement>('input');
        if (!input) return;
        chip.dataset.checked = input.checked ? 'true' : 'false';
      });
    };

    const toggleConditional = () => {
      const fd = form ? new FormData(form) : null;
      if (!fd) return;
      const needsAV = fd.get('needs_av') || '';
      const media = fd.get('media_interest') || '';
      const avWrap = document.getElementById('avDetailsWrap');
      const mediaWrap = document.getElementById('mediaDetailsWrap');
      if (avWrap) avWrap.style.display = needsAV === 'Sí' || needsAV === 'No estoy seguro' ? 'block' : 'none';
      if (mediaWrap) mediaWrap.style.display = media === 'Sí' || media === 'Tal vez' ? 'block' : 'none';
    };

    const setMinDate = () => {
      const dateInput = document.getElementById('date') as HTMLInputElement | null;
      if (!dateInput) return;
      const d = new Date();
      d.setDate(d.getDate() + 1);
      dateInput.min = d.toISOString().slice(0, 10);
    };

    const validateField = (field: HTMLInputElement | HTMLTextAreaElement) => {
      const value = field.value.trim();
      const id = field.id || field.name;
      let isValid = true;
      let message = '';

      if (id === 'name') {
        isValid = value.length >= 2;
        if (!isValid) message = 'Por favor, escribe tu nombre completo.';
      } else if (id === 'phone') {
        isValid = value.replace(/\D/g, '').length >= 8;
        if (!isValid) message = 'El teléfono debe tener al menos 8 dígitos.';
      } else if (id === 'email') {
        isValid = value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (!isValid) message = 'Escribe un correo válido o deja el campo vacío.';
      } else if (id === 'date') {
        isValid = value !== '';
        if (!isValid) message = 'Selecciona una fecha para tu evento.';
      } else if (id === 'time') {
        isValid = value !== '';
        if (!isValid) message = 'Indica la hora de inicio del evento.';
      } else if (id === 'guests') {
        const num = Number(value);
        isValid = num >= 1 && num <= 1000;
        if (!isValid) message = 'La cantidad de invitados debe estar entre 1 y 1000.';
      } else if (id === 'eventType') {
        isValid = value !== '';
        if (!isValid) message = 'Selecciona el tipo de evento.';
      }

      if (!isValid) {
        setErrors(prev => ({ ...prev, [id]: message }));
        field.classList.add('error');
      } else {
        setErrors(prev => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
        field.classList.remove('error');
      }
      field.classList.toggle('valid', isValid && value !== '');
    };

    const validateFieldByName = (name: string, value: string | null, message: string) => {
      const isValid = Boolean((value || '').trim());
      if (!isValid) {
        setErrors(prev => ({ ...prev, [name]: message }));
      } else {
        setErrors(prev => {
          const copy = { ...prev };
          delete copy[name];
          return copy;
        });
      }
      return isValid;
    };

    const validateForm = () => {
      if (!form) return false;
      const fd = new FormData(form);
      const newErrors: Record<string, string> = {};

      const check = (name: string, condition: boolean, message: string) => {
        if (!condition) newErrors[name] = message;
      };

      const name = (fd.get('name') || '').toString().trim();
      const phone = (fd.get('phone') || '').toString().replace(/\D/g, '');
      const guestsValue = Number(fd.get('guests'));
      const needsAV = (fd.get('needs_av') || '').toString().trim();
      const mediaInterest = (fd.get('media_interest') || '').toString().trim();
      const consent = (document.getElementById('consent') as HTMLInputElement | null)?.checked;

      check('name', name.length >= 2, 'Por favor, escribe tu nombre completo.');
      check('phone', phone.length >= 8, 'El teléfono debe tener al menos 8 dígitos.');
      check('date', Boolean(fd.get('date')), 'Selecciona una fecha para tu evento.');
      check('time', Boolean(fd.get('time')), 'Indica la hora de inicio del evento.');
      check('guests', !Number.isNaN(guestsValue) && guestsValue >= 1 && guestsValue <= 1000, 'La cantidad de invitados debe estar entre 1 y 1000.');
      check('eventType', Boolean(fd.get('event_type')), 'Selecciona el tipo de evento.');
      check('needs_av', needsAV !== '', 'Selecciona si necesitas equipo audiovisual.');
      check('media_interest', mediaInterest !== '', 'Selecciona si te interesan paquetes de foto/video.');
      check('consent', Boolean(consent), 'Debes aceptar el contacto por WhatsApp o llamada.');

      setErrors(newErrors);

      if (!errorPanel) return Object.keys(newErrors).length === 0;
      if (Object.keys(newErrors).length) {
        errorPanel.classList.add('show');
        errorPanel.textContent = 'Revisa la información resaltada para continuar.';
      } else {
        errorPanel.classList.remove('show');
        errorPanel.textContent = '';
      }

      if (Object.keys(newErrors).length) {
        const firstKey = Object.keys(newErrors)[0];
        const target =
          (form.querySelector(`[name="${firstKey}"]`) as HTMLElement | null) ||
          (form.querySelector(`#${firstKey}`) as HTMLElement | null);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.focus?.();
        }
        return false;
      }

      return true;
    };

    const showPreview = () => {
      if (!form || !previewEl) return;
      const fd = new FormData(form);
      const items: string[] = [];
      fd.forEach((value, key) => {
        if (key === 'av_items') items.push(value.toString());
      });
      const avItems = items.length ? items.join(', ') : '—';
      const esc = (value: string | null) =>
        (value ?? '—')
          .toString()
          .replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));

      previewEl.innerHTML = `
        <strong>Vista previa — Marlett</strong><br><br>
        <div style="display:grid;grid-template-columns:170px 1fr;gap:6px 12px">
          <div>Nombre</div><div>${esc(fd.get('name')?.toString() ?? '—')}</div>
          <div>Teléfono</div><div>${esc(fd.get('phone')?.toString() ?? '—')}</div>
          <div>Correo</div><div>${esc(fd.get('email')?.toString() ?? '—')}</div>
          <div>Fecha</div><div>${esc(fd.get('date')?.toString() ?? '—')}</div>
          <div>Hora</div><div>${esc(fd.get('time')?.toString() ?? '—')}</div>
          <div>Invitados</div><div>${esc(fd.get('guests')?.toString() ?? '—')}</div>
          <div>Tipo de evento</div><div>${esc(fd.get('event_type')?.toString() ?? '—')}</div>
          <div>Área</div><div>${esc(fd.get('venue_area')?.toString() ?? '—')}</div>
          <div>A/V</div><div>${esc(fd.get('needs_av')?.toString() ?? '—')}</div>
          <div>Elementos A/V</div><div>${esc(avItems)}</div>
          <div>Notas A/V</div><div>${esc(fd.get('av_notes')?.toString() ?? '—')}</div>
          <div>Foto/Video</div><div>${esc(fd.get('media_interest')?.toString() ?? '—')}</div>
          <div>Notas media</div><div>${esc(fd.get('media_notes')?.toString() ?? '—')}</div>
          <div>Notas</div><div>${esc(fd.get('notes')?.toString() ?? '—')}</div>
        </div>`;
      previewEl.style.display = 'block';
    };

    const getWhatsAppNumber = () => MARLETT_WHATSAPP;

    const buildWhatsAppText = (fd: FormData) => {
      const parts: string[] = [];
      const addLine = (label: string, value: string | null) => {
        if (value && value.trim() && value !== '—') parts.push(`• ${label}: ${value}`);
      };

      const mapValue = (key: string) => (fd.get(key) || '—').toString();

      addLine('Nombre', mapValue('name'));
      addLine('Teléfono', mapValue('phone'));
      addLine('Fecha', mapValue('date'));
      addLine('Hora', mapValue('time'));
      addLine('Invitados', mapValue('guests'));
      addLine('Tipo de evento', mapValue('event_type'));
      const venue = mapValue('venue_area');
      if (venue && venue !== '—') addLine('Área preferida', venue);
      addLine('A/V', mapValue('needs_av'));

      const avItems: string[] = [];
      fd.forEach((value, key) => {
        if (key === 'av_items') avItems.push(value.toString());
      });
      if (avItems.length) addLine('Elementos A/V', avItems.join(', '));
      const avNotes = mapValue('av_notes');
      if (avNotes && avNotes !== '—') addLine('Notas A/V', avNotes);
      addLine('Foto/Video', mapValue('media_interest'));
      const mediaNotes = mapValue('media_notes');
      if (mediaNotes && mediaNotes !== '—') addLine('Notas media', mediaNotes);
      const notes = mapValue('notes');
      if (notes && notes !== '—') addLine('Notas adicionales', notes);

      if (!parts.length) {
        parts.push('Hola, me gustaría más información sobre eventos en Marlett.');
      }

      return parts.join('\n');
    };

    const openWhatsAppWithText = (numberDigitsOnly: string, text: string) => {
      if (!numberDigitsOnly) {
        alert('No hay un número de WhatsApp configurado para Marlett.');
        return;
      }
      const url = `https://wa.me/${numberDigitsOnly}?text=${encodeURIComponent(text)}`;
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (!win) window.location.href = url;
    };

    const handleSubmit = async (event: Event) => {
      event.preventDefault();

      if (!validateForm()) {
        alert('Completa los campos obligatorios y acepta el consentimiento.');
        return;
      }

      const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      const fd = new FormData(form);

      const getValue = (key: string) => {
        const value = fd.get(key);
        return value !== null ? value.toString() : null;
      };

      const avItemsArray = fd
        .getAll('av_items')
        .map((value) => value.toString())
        .filter((value) => value.trim().length > 0);
      const invitadosRaw = parseInt((fd.get('guests') || '0').toString(), 10);
      const invitados = Number.isNaN(invitadosRaw)
        ? 1
        : Math.min(Math.max(invitadosRaw, 1), 1000);
      const reservationData = {
        nombre_completo: getValue('name') || '',
        telefono_whatsapp: getValue('phone') || '',
        correo: getValue('email'),
        area_preferida: getValue('venue_area'),
        tipo_evento: getValue('event_type') || '',
        fecha_evento: getValue('date') || new Date().toISOString().slice(0, 10),
        hora_inicio: getValue('time'),
        cantidad_invitados: invitados,
        needs_av: getValue('needs_av'),
        av_items: avItemsArray.length ? avItemsArray : null,
        av_notes: getValue('av_notes'),
        media_interest: getValue('media_interest'),
        media_notes: getValue('media_notes'),
        notes: getValue('notes'),
        status: 'pending'
      };

      form.classList.add('loading');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
      }

      try {
        const { error } = await supabase.from('reservas_marlett').insert([reservationData]);

        if (error) {
          console.warn('Supabase client insert failed, attempting REST fallback', error);
          const response = await fetch(`${SUPABASE_URL}/rest/v1/reservas_marlett`, {
            method: 'POST',
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal'
            },
            body: JSON.stringify(reservationData)
          });

          if (!response.ok) {
            const responseText = await response.text();
            throw new Error(responseText || `REST insert failed with status ${response.status}`);
          }
        }

        setShowSuccess(true);
        showPreview();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          if (previewEl) previewEl.style.display = 'none';
        }, 10000);

        const waText = buildWhatsAppText(fd);
        openWhatsAppWithText(getWhatsAppNumber(), waText);

        form.reset();
        refreshChips();
        toggleConditional();
        setErrors({});
      } catch (err) {
        console.error('Error submitting form:', err);
        if (errorPanel) {
          errorPanel.classList.add('show');
          errorPanel.textContent = 'No pudimos guardar tu solicitud. Verifica tu conexión e inténtalo de nuevo.';
        }
        alert('No pudimos guardar tu solicitud. Verifica tu conexión e inténtalo de nuevo.');
        return;
      } finally {
        form.classList.remove('loading');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Enviar solicitud';
        }
      }
    };

    const handleQuickWhatsApp = (defaultMessage?: string) => {
      if (!form) {
        openWhatsAppWithText(MARLETT_WHATSAPP, defaultMessage || 'Hola, me gustaría más información sobre eventos en Marlett.');
        return;
      }
      const fd = new FormData(form);
      const text = buildWhatsAppText(fd);
      openWhatsAppWithText(getWhatsAppNumber(), text);
    };

    const handlePreviewClick = () => showPreview();

    const handleInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (!target) return;
      if (target.matches('.chip input')) refreshChips();
      if (target.id === 'phone') {
        target.value = target.value.replace(/[^\d+]/g, '').replace(/\s+/g, '');
      }
      if (target.name === 'needs_av' || target.name === 'media_interest') {
        refreshChips();
        toggleConditional();
      }
      if (target.classList.contains('fld')) validateField(target);
    };

    const handleBlur = (event: FocusEvent) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement | null;
      if (target && target.classList.contains('fld')) validateField(target);
    };

    const handleChange = (event: Event) => {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement | null;
      if (target && target.classList.contains('fld')) validateField(target);
    };

    const initChoiceGroups = () => {
      document.querySelectorAll<HTMLElement>('.choice-group').forEach((group) => {
        const hidden = group.nextElementSibling as HTMLInputElement | null;
        if (!hidden || hidden.type !== 'hidden') return;
        const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>('.choice-btn'));

        const setActive = (value: string) => {
          buttons.forEach((btn) => {
            const btnValue = (btn.dataset.value || btn.textContent || '').trim();
            btn.classList.toggle('is-active', btnValue === value);
          });
        };

        const applyValue = (value: string) => {
          hidden.value = value;
          setActive(value);

          if (hidden.name === 'needs_av' || hidden.name === 'media_interest') {
            toggleConditional();
          }
        };

        if (hidden.value.trim()) {
          setActive(hidden.value.trim());
        }

        const clickHandler = (event: Event) => {
          const btn = (event.target as HTMLElement).closest<HTMLButtonElement>('.choice-btn');
          if (!btn) return;
          const value = (btn.dataset.value || btn.textContent || '').trim();
          applyValue(value);
        };

        addListener(group, 'click', clickHandler);
      });
    };

    const cleanup: Array<() => void> = [];

    if (intervalId) {
      cleanup.push(() => window.clearInterval(intervalId));
    }

    if (form) {
      addListener(form, 'submit', handleSubmit as EventListener);
      addListener(document, 'input', handleInput as EventListener);
      addListener(document, 'change', handleChange as EventListener);
      addListener(document, 'blur', handleBlur as EventListener, true);
      addListener(previewBtn, 'click', handlePreviewClick as EventListener);

      const ctaHandler = () => handleQuickWhatsApp();
      addListener(ctaWapp, 'click', ctaHandler);
      addListener(navbarWapp, 'click', ctaHandler);

      setMinDate();
      refreshChips();
      toggleConditional();
      initChoiceGroups();
    }

    return () => {
      listeners.forEach((fn) => fn());
      cleanup.forEach((fn) => fn());
    };
  }, []);

  return (
    <div className="app-shell">
      <SuccessToast visible={showSuccess} onDismiss={() => setShowSuccess(false)} />
      <div id="themePicker">
        <button data-theme="theme-altos" className="tbtn">Altos</button>
        <button data-theme="theme-marfil" className="tbtn">Marfil</button>
        <button data-theme="theme-dorado" className="tbtn">Dorado</button>
        <button data-theme="theme-terracota" className="tbtn">Terracota</button>
      </div>

      <header className="navbar">
        <div className="navbar-inner">
          <img src="/assets/Marlett_high_contrast.jpg" alt="Marlett Logo" className="navbar-logo" />
          <div className="navbar-text navbar-title">
            <h1>Marlett</h1>
            <p>Agenda tu evento — Restaurante &amp; Salón de eventos</p>
          </div>
          <div className="navbar-actions top-actions">
            <a href="#resForm" className="navbar-cta">Reservar mi fecha</a>
            <button type="button" className="navbar-cta-ghost" id="navbarWapp">
              <img src="/assets/Whatappmarlett.png" alt="WhatsApp" className="whatsapp-icon" />
              WhatsApp Marlett
            </button>
          </div>
        </div>
      </header>

      <Hero />

      <main className="page-content contenedor-principal">
        <div className="borde-hojas borde-hojas-dark"></div>

        <section className="marlett-divider" aria-label="Frase de transición">
          <h2 className="golden-text scroll-animate">COME. COMPARTE. DISFRUTA.</h2>
        </section>

        <section className="wrap" aria-label="Ambientes Marlett">
          <div className="card pad ambientes-card">
            <section className="ambientes" aria-labelledby="ambientes-title">
              <div className="ambientes-header" id="ambientes-title">
                <h2>Conoce nuestros ambientes</h2>
                <p>Lobby, accesibilidad, sala de eventos y montaje.</p>
              </div>

              <div className="ambientes-carousel">
                <button className="amb-btn prev" aria-label="Anterior">‹</button>
                <div className="ambientes-track">
                  {ambientes.map(({ id, title, description, image }) => (
                    <article className="ambiente-item" data-id={id} key={id}>
                      <img src={image} alt={title} loading="lazy" />
                      <div className="ambiente-caption">
                        <h3>{title}</h3>
                        <p>{description}</p>
                      </div>
                    </article>
                  ))}
                </div>
                <button className="amb-btn next" aria-label="Siguiente">›</button>
              </div>

              <div className="ambientes-dots" role="tablist" aria-label="Selecciona un ambiente">
                {ambientes.map((_, index) => (
                  <button key={index} data-slide={index} type="button" className={index === 0 ? 'active' : ''}></button>
                ))}
              </div>
            </section>
          </div>
        </section>

        <section className="wrap grid grid-2" aria-label="Reservación">
          <div className="card pad reservation-card">
            <div className="marlett-panel">
              <div className="marlett-badge">
                <img src="/assets/Marlett_high_contrast.jpg" alt="Marlett — Reserva tu evento" className="marlett-badge-img" loading="lazy" decoding="async" />
              </div>
              <div className="panel-body">
                <div className="header">
                  <div>
                    <strong>Reserva tu evento</strong><br />
                    <small>Responderemos rápido por WhatsApp o correo.</small>
                  </div>
                </div>

                <div className="form-top">
                  <p className="eyebrow">Coordinación personal</p>
                  <h2>Agenda tu evento en Marlett</h2>
                  <p className="sub">Te contactamos por WhatsApp para confirmar disponibilidad.</p>
                </div>

                <form id="resForm" className="form-grid" noValidate data-whatsapp="+52 33 1900 6852">
                  <div id="formError" className="form-error" role="alert"></div>
                  <p className="section-title">Información de contacto</p>
                  <div className="row-span-2 section soft-panel" aria-label="Información de contacto">
                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="name">Nombre completo <span className="req">*</span></label>
                        <input className="fld" id="name" name="name" type="text" placeholder="Juan Pérez" autoComplete="name" required minLength={2} />
                        {errors.name && <div className="field-error">{errors.name}</div>}
                      </div>
                      <div className="form-field">
                        <label htmlFor="phone">Teléfono (WhatsApp) <span className="req">*</span></label>
                        <input className="fld" id="phone" name="phone" type="tel" inputMode="tel" placeholder="+52 33 1234 5678" autoComplete="tel" required />
                        <div className="hint">WhatsApp o celular de contacto.</div>
                        {errors.phone && <div className="field-error">{errors.phone}</div>}
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="email">Correo (opcional)</label>
                        <input className="fld" id="email" name="email" type="email" placeholder="tucorreo@ejemplo.com" autoComplete="email" />
                        {errors.email && <div className="field-error">{errors.email}</div>}
                      </div>
                      <div className="form-field">
                        <label htmlFor="venueArea">Área preferida</label>
                        <input className="fld" id="venueArea" name="venue_area" list="areas" placeholder="Selecciona o escribe…" />
                        <datalist id="areas">
                          <option>Sala Marlett</option>
                        </datalist>
                        {errors.venue_area && <div className="field-error">{errors.venue_area}</div>}
                      </div>
                    </div>
                  </div>

                  {/* DATOS DEL EVENTO */}
                  <p className="section-title">Datos del evento</p>
                  <div
                    className="row-span-2 section soft-panel"
                    aria-label="Datos del evento"
                  >
                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="date">
                          Fecha del evento <span className="req">*</span>
                        </label>
                        <input
                          className="fld"
                          id="date"
                          name="date"
                          type="date"
                          required
                        />
                        {errors.date && <div className="field-error">{errors.date}</div>}
                      </div>
                      <div className="form-field">
                        <label htmlFor="time">
                          Hora de inicio <span className="req">*</span>
                        </label>
                        <input
                          className="fld"
                          id="time"
                          name="time"
                          type="time"
                          required
                        />
                        {errors.time && <div className="field-error">{errors.time}</div>}
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="guests">
                          Cantidad de invitados <span className="req">*</span>
                        </label>
                        <input
                          className="fld"
                          id="guests"
                          name="guests"
                          type="number"
                          min={1}
                          max={1000}
                          placeholder="Ej. 120"
                          required
                        />
                        {errors.guests && <div className="field-error">{errors.guests}</div>}
                      </div>
                      <div className="form-field">
                        <label htmlFor="eventType">
                          Tipo de evento <span className="req">*</span>
                        </label>
                        <input
                          className="fld"
                          id="eventType"
                          name="event_type"
                          list="eventTypes"
                          placeholder="Selecciona o escribe…"
                          required
                        />
                        <datalist id="eventTypes">
                          <option>Boda</option>
                          <option>XV / Quinceañera</option>
                          <option>Cumpleaños</option>
                          <option>Corporativo</option>
                          <option>Graduación</option>
                          <option>Baby Shower</option>
                          <option>Pedida / Compromiso</option>
                          <option>Otro</option>
                        </datalist>
                        {errors.eventType && <div className="field-error">{errors.eventType}</div>}
                      </div>
                    </div>
                  </div>

                  {/* SERVICIOS ADICIONALES */}
                  <p className="section-title">Servicios adicionales</p>
                  <div
                    className="row-span-2 section soft-panel services-section"
                    aria-label="Servicios adicionales"
                  >
                    <div className="form-row">
                      {/* Columna 1: A/V */}
                      <div className="form-field services-column">
                        <label className="form-label">
                          ¿Planean usar visuales (pantallas, proyector) o audio?{" "}
                          <span className="req">*</span>
                        </label>

                        <div
                          className="choice-group"
                          data-choice="visuales"
                          role="group"
                          aria-label="Requerimiento A/V"
                        >
                          <button type="button" className="choice-btn" data-value="Sí">
                            Sí
                          </button>
                          <button type="button" className="choice-btn" data-value="No">
                            No
                          </button>
                          <button
                            type="button"
                            className="choice-btn"
                            data-value="No estoy seguro"
                          >
                            No estoy seguro
                          </button>
                        </div>

                        <input type="hidden" name="needs_av" value="" />

                        <div
                          id="avDetailsWrap"
                          style={{ display: 'none', marginTop: '12px' }}
                        >
                          <div className="hint" style={{ marginBottom: '8px' }}>
                            Selecciona lo que podría necesitar tu evento:
                          </div>

                          <div className="chip-group">
                            <label className="chip">
                              <input type="checkbox" name="av_items" value="Proyector" />
                              Proyector
                            </label>
                            <label className="chip">
                              <input type="checkbox" name="av_items" value="Pantalla" />
                              Pantalla
                            </label>
                            <label className="chip">
                              <input type="checkbox" name="av_items" value="Micrófonos" />
                              Micrófonos
                            </label>
                            <label className="chip">
                              <input type="checkbox" name="av_items" value="Bocinas" />
                              Bocinas
                            </label>
                            <label className="chip">
                              <input type="checkbox" name="av_items" value="Iluminación" />
                              Iluminación
                            </label>
                            <label className="chip">
                              <input type="checkbox" name="av_items" value="Muro LED" />
                              Muro LED
                            </label>
                          </div>

                          <label htmlFor="avNotes" style={{ marginTop: '12px' }}>
                            Detalles A/V
                          </label>
                          <textarea
                            className="fld"
                            id="avNotes"
                            name="av_notes"
                            rows={3}
                            placeholder="Ej. 2 micrófonos inalámbricos, HDMI, pantalla cerca del escenario…"
                          ></textarea>
                          {errors.av_notes && (
                            <div className="field-error">{errors.av_notes}</div>
                          )}
                        </div>

                        {errors.needs_av && (
                          <div className="field-error">{errors.needs_av}</div>
                        )}
                      </div>

                      {/* Columna 2: Foto / Video */}
                      <div className="form-field services-column">
                        <label className="form-label">
                          ¿Te interesan paquetes de Foto/Video?{" "}
                          <span className="req">*</span>
                        </label>

                        <div
                          className="choice-group"
                          data-choice="media"
                          role="group"
                          aria-label="Interés en Foto/Video"
                        >
                          <button type="button" className="choice-btn" data-value="Sí">
                            Sí
                          </button>
                          <button type="button" className="choice-btn" data-value="No">
                            No
                          </button>
                          <button
                            type="button"
                            className="choice-btn"
                            data-value="Tal vez"
                          >
                            Tal vez
                          </button>
                        </div>

                        <input type="hidden" name="media_interest" value="" />

                        <div
                          id="mediaDetailsWrap"
                          style={{ display: 'none', marginTop: '12px' }}
                        >
                          <label htmlFor="mediaNotes">Cuéntanos qué buscas</label>
                          <textarea
                            className="fld"
                            id="mediaNotes"
                            name="media_notes"
                            rows={3}
                            placeholder="Ej. highlight reel, cabina de fotos, dron…"
                          ></textarea>
                          {errors.media_notes && (
                            <div className="field-error">{errors.media_notes}</div>
                          )}
                        </div>

                        {errors.media_interest && (
                          <div className="field-error">{errors.media_interest}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="row-span-2 form-group">
                    <label className="form-label" htmlFor="notes">Algo más que debamos saber (opcional)</label>
                    <div className="note-letter">
                      <textarea className="fld note-text" id="notes" name="notes" rows={5} placeholder="Querido equipo Marlett, me gustaría compartir algunos detalles sobre mi evento..."></textarea>
                    </div>
                    <div className="hint" style={{ marginTop: '10px' }}>Usaremos tu información solo para dar seguimiento a tu solicitud.</div>
                    <label className="consent-label">
                      <input type="checkbox" id="consent" required />
                      Acepto ser contactad@ por WhatsApp/llamada para confirmar mi evento <span className="req">*</span>
                    </label>
                    {errors.consent && <div className="field-error">{errors.consent}</div>}
                  </div>

                  <div className="row-span-2 actions">
                    <button type="button" className="btn btn-ghost" id="previewBtn" aria-controls="preview">Vista previa</button>
                    <button type="submit" className="btn btn-primary">Enviar solicitud</button>
                  </div>

                  <div id="preview" className="row-span-2 section soft-panel" style={{ display: 'none' }}></div>
                  <input type="text" name="_company" tabIndex={-1} autoComplete="off" style={{ position: 'absolute', left: '-9999px', opacity: 0 }} />
                </form>
              </div>
            </div>
          </div>

          <aside className="sidebar-banner form-side-panel" aria-label="Ambiente Marlett">
            <div className="sidebar-image-wrap">
              <img src="/assets/ambiente-marlett-vertical.jpg" alt="Ambiente Marlett vertical" className="sidebar-image" loading="lazy" decoding="async" />
            </div>
          </aside>
        </section>

        <button className="sticky-cta" id="ctaWapp">
          <img src="/assets/Whatappmarlett.png" alt="WhatsApp" className="whatsapp-icon" />
          WhatsApp Marlett
        </button>
      </main>
    </div>
  );
}

export default App;


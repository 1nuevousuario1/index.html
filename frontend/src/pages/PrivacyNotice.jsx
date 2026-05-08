import React from "react";
import { Shield, FileText, Lock, UserCheck, Mail, MapPin } from "lucide-react";

export default function PrivacyNotice() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12" data-testid="privacy-page">
      <div className="text-center mb-10">
        <div className="inline-flex w-20 h-20 bg-[#4CAFEE]/10 rounded-3xl items-center justify-center mb-4">
          <Shield size={40} className="text-[#4CAFEE]" strokeWidth={2.5} />
        </div>
        <h1 className="font-fredoka text-4xl sm:text-5xl font-bold text-[#1F2937]">
          Aviso de Privacidad
        </h1>
        <p className="text-[#4B5563] font-nunito mt-3">
          Última actualización: febrero 2026
        </p>
      </div>

      <div className="mi-card p-8 sm:p-10 space-y-6 font-nunito text-[#1F2937]">
        <section>
          <h2 className="font-fredoka text-2xl font-bold text-[#4CAFEE] mb-3">
            1. Identidad del Responsable
          </h2>
          <p className="leading-relaxed">
            <strong>Mundo Infantil</strong> (en adelante "el Responsable"), con domicilio en
            Boulevard Huizache 206, Ciudad Miguel Alemán, México, 88306, es responsable
            del tratamiento de sus datos personales conforme a la Ley Federal de
            Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
          </p>
          <ul className="mt-3 space-y-1 text-sm text-[#4B5563]">
            <li className="flex items-center gap-2">
              <MapPin size={14} className="text-[#4CAFEE]" />
              Boulevard Huizache 206, Ciudad Miguel Alemán, México, 88306
            </li>
            <li className="flex items-center gap-2">
              <Mail size={14} className="text-[#4CAFEE]" />
              hola@mundo-infantil.lat
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-fredoka text-2xl font-bold text-[#4CAFEE] mb-3">
            2. Datos Personales que Recabamos
          </h2>
          <p className="leading-relaxed mb-2">
            Para las finalidades descritas en este Aviso de Privacidad, podemos recabar
            los siguientes datos personales:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Datos de identificación:</strong> nombre completo</li>
            <li><strong>Datos de contacto:</strong> correo electrónico, teléfono</li>
            <li><strong>Datos de envío:</strong> dirección postal completa</li>
            <li><strong>Datos de facturación:</strong> RFC y razón social (si aplica)</li>
            <li><strong>Datos financieros:</strong> los datos de su tarjeta NO son almacenados por nosotros; el procesamiento lo realiza Stripe Inc.</li>
            <li><strong>Datos de navegación:</strong> dirección IP, navegador, páginas visitadas</li>
          </ul>
        </section>

        <section>
          <h2 className="font-fredoka text-2xl font-bold text-[#4CAFEE] mb-3">
            3. Finalidades del Tratamiento
          </h2>
          <p className="leading-relaxed mb-2">
            <strong>Finalidades primarias</strong> (necesarias para la relación comercial):
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Procesar y enviar sus pedidos de juguetes</li>
            <li>Emitir comprobantes fiscales</li>
            <li>Atender quejas, devoluciones y aclaraciones</li>
            <li>Administrar su cuenta de cliente y programa de recompensas</li>
            <li>Cumplir obligaciones legales y fiscales</li>
          </ul>
          <p className="leading-relaxed mt-3 mb-2">
            <strong>Finalidades secundarias</strong> (puede oponerse a estas):
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Envío de promociones, ofertas y novedades</li>
            <li>Encuestas de satisfacción y mejora del servicio</li>
            <li>Análisis estadísticos del comportamiento de compra</li>
          </ul>
        </section>

        <section>
          <h2 className="font-fredoka text-2xl font-bold text-[#4CAFEE] mb-3">
            4. Transferencia de Datos
          </h2>
          <p className="leading-relaxed">
            Sus datos personales podrán ser compartidos con los siguientes terceros
            únicamente para cumplir con las finalidades indicadas:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li><strong>Stripe Inc.</strong> — para el procesamiento de pagos</li>
            <li><strong>Empresas de paquetería</strong> — para envíos a domicilio</li>
            <li><strong>Autoridades fiscales</strong> — cuando así lo requiera la ley</li>
          </ul>
          <p className="mt-3 leading-relaxed">
            No vendemos ni rentamos sus datos personales a terceros.
          </p>
        </section>

        <section>
          <h2 className="font-fredoka text-2xl font-bold text-[#4CAFEE] mb-3">
            5. Sus Derechos ARCO
          </h2>
          <p className="leading-relaxed mb-2">
            Usted tiene derecho a:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {[
              { letter: "A", word: "Acceso", desc: "conocer sus datos en nuestra posesión" },
              { letter: "R", word: "Rectificación", desc: "corregir datos inexactos" },
              { letter: "C", word: "Cancelación", desc: "eliminar sus datos" },
              { letter: "O", word: "Oposición", desc: "negarse al uso de sus datos" },
            ].map((d) => (
              <div key={d.letter} className="flex gap-3 p-3 bg-[#F9F9F9] rounded-2xl">
                <span className="font-fredoka text-2xl font-bold text-[#FF6B6B]">{d.letter}</span>
                <div>
                  <p className="font-fredoka font-semibold">{d.word}</p>
                  <p className="text-sm text-[#4B5563]">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 leading-relaxed">
            Para ejercer sus derechos ARCO, envíe una solicitud al correo
            <strong> hola@mundo-infantil.lat </strong>
            indicando: nombre completo, descripción clara de los datos
            sobre los que ejerce su derecho, y copia de identificación oficial.
            Responderemos en un plazo máximo de 20 días hábiles.
          </p>
        </section>

        <section>
          <h2 className="font-fredoka text-2xl font-bold text-[#4CAFEE] mb-3">
            6. Uso de Cookies y Tecnologías Similares
          </h2>
          <p className="leading-relaxed">
            Utilizamos cookies y tecnologías similares para mejorar su experiencia,
            mantener su sesión iniciada, recordar el contenido de su carrito y analizar
            el tráfico del sitio. Puede deshabilitarlas desde la configuración de su
            navegador, aunque algunas funcionalidades podrían verse afectadas.
          </p>
        </section>

        <section>
          <h2 className="font-fredoka text-2xl font-bold text-[#4CAFEE] mb-3">
            7. Medidas de Seguridad
          </h2>
          <div className="grid sm:grid-cols-3 gap-3 mt-3">
            {[
              { icon: Lock, text: "Conexión cifrada HTTPS/SSL" },
              { icon: Shield, text: "Contraseñas encriptadas con bcrypt" },
              { icon: UserCheck, text: "Acceso restringido a datos" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="text-center p-4 bg-[#F9F9F9] rounded-2xl">
                  <Icon size={28} className="mx-auto text-[#6BCB77] mb-2" />
                  <p className="text-sm font-fredoka">{item.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-fredoka text-2xl font-bold text-[#4CAFEE] mb-3">
            8. Cambios al Aviso de Privacidad
          </h2>
          <p className="leading-relaxed">
            Nos reservamos el derecho de modificar este Aviso de Privacidad. Cualquier
            cambio será publicado en este mismo sitio web con la fecha de su última
            actualización. Le recomendamos revisar periódicamente esta página.
          </p>
        </section>

        <section className="pt-4 border-t border-[#E5E7EB]">
          <p className="text-sm text-[#4B5563] italic leading-relaxed">
            Al utilizar nuestro sitio y/o registrarse, usted manifiesta haber leído y
            aceptado el presente Aviso de Privacidad. Para cualquier duda, puede
            contactarnos al correo: <strong>hola@mundo-infantil.lat</strong>
          </p>
        </section>
      </div>
    </div>
  );
}

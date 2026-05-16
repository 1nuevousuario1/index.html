import React from "react";
import { FileText, Truck, RotateCcw, CreditCard, AlertCircle, Scale } from "lucide-react";

export default function TermsConditions() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12" data-testid="terms-page">
      <div className="text-center mb-10">
        <div className="inline-flex w-20 h-20 bg-[#FFD93D]/30 rounded-3xl items-center justify-center mb-4">
          <FileText size={40} className="text-[#1F2937]" strokeWidth={2.5} />
        </div>
        <h1 className="font-fredoka text-4xl sm:text-5xl font-bold text-[#1F2937]">
          Términos y Condiciones
        </h1>
        <p className="text-[#4B5563] font-nunito mt-3">
          Última actualización: febrero 2026
        </p>
      </div>

      <div className="mi-card p-8 sm:p-10 space-y-6 font-nunito text-[#1F2937]">
        <section>
          <h2 className="font-fredoka text-2xl font-bold text-[#FF6B6B] mb-3">
            1. Aceptación de los Términos
          </h2>
          <p className="leading-relaxed">
            Al acceder y utilizar el sitio web <strong>www.mundo-infantil.lat</strong>
            (en adelante "el Sitio"), usted acepta estar sujeto a los presentes Términos
            y Condiciones, así como a nuestro Aviso de Privacidad. Si no está de acuerdo
            con alguno de estos términos, le solicitamos no utilizar el Sitio.
          </p>
        </section>

        <section>
          <h2 className="font-fredoka text-2xl font-bold text-[#FF6B6B] mb-3">
            2. Información del Comerciante
          </h2>
          <ul className="space-y-1">
            <li><strong>Razón comercial:</strong> Mundo Infantil</li>
            <li><strong>Domicilio:</strong> Boulevard Huizache 206, Ciudad Miguel Alemán, México, 88306</li>
            <li><strong>Teléfono:</strong> 897 107 6125</li>
            <li><strong>Correo:</strong> hola@mundo-infantil.lat</li>
            <li><strong>Giro:</strong> Venta de juguetes y artículos para bebés/niños</li>
          </ul>
        </section>

        <section>
          <h2 className="font-fredoka text-2xl font-bold text-[#FF6B6B] mb-3">
            3. Productos y Precios
          </h2>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              Todos los precios mostrados están en <strong>pesos mexicanos (MXN)</strong>
              e incluyen los impuestos aplicables.
            </li>
            <li>
              Las imágenes de los productos son ilustrativas. El producto físico
              puede presentar variaciones menores en color, empaque o accesorios.
            </li>
            <li>
              Nos reservamos el derecho de modificar precios y disponibilidad sin
              previo aviso. El precio aplicable será el vigente al momento de
              confirmar el pedido.
            </li>
            <li>
              En caso de error tipográfico evidente en el precio, nos reservamos el
              derecho de cancelar la compra y reembolsar lo pagado.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-fredoka text-2xl font-bold text-[#FF6B6B] mb-3 flex items-center gap-2">
            <CreditCard size={24} /> 4. Métodos de Pago
          </h2>
          <p className="leading-relaxed mb-2">
            Aceptamos los siguientes métodos de pago a través de la plataforma Stripe:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Tarjetas de crédito y débito (Visa, Mastercard, American Express)</li>
            <li>OXXO Pay (referencia para pago en efectivo)</li>
            <li>SPEI (transferencia electrónica)</li>
          </ul>
          <p className="leading-relaxed mt-3">
            Todas las transacciones son procesadas mediante conexión segura cifrada.
            <strong> Mundo Infantil no almacena los datos de su tarjeta</strong>; estos son
            procesados directamente por Stripe Inc., empresa certificada PCI-DSS Level 1.
          </p>
        </section>

        <section>
          <h2 className="font-fredoka text-2xl font-bold text-[#FF6B6B] mb-3 flex items-center gap-2">
            <Truck size={24} /> 5. Envíos y Entregas
          </h2>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>Misma ciudad (Ciudad Miguel Alemán):</strong> La entrega se
              realiza con costo de reparto local, que se acuerda al confirmar el
              pedido según la zona.
            </li>
            <li>
              <strong>Otras ciudades:</strong> Realizamos envíos a toda la República
              Mexicana. El costo de envío se calcula según peso y destino.
            </li>
            <li className="text-[#6BCB77] font-semibold">
              🚚 <strong>Envío GRATIS</strong> en compras mayores a $2,000 MXN
              (aplicable a todo el país).
            </li>
            <li>
              <strong>Tiempos de entrega:</strong> 24-72 horas hábiles dentro de la
              ciudad. Envíos foráneos: 3-7 días hábiles dependiendo de la ubicación.
              Zonas rurales pueden tardar hasta 10 días hábiles.
            </li>
            <li>
              Es responsabilidad del cliente proporcionar una dirección correcta y
              completa. No nos hacemos responsables por entregas fallidas debido a
              datos incorrectos.
            </li>
            <li>
              Una vez entregado el paquete, el riesgo se transfiere al comprador.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-fredoka text-2xl font-bold text-[#FF6B6B] mb-3 flex items-center gap-2">
            <RotateCcw size={24} /> 6. Devoluciones y Reembolsos
          </h2>
          <p className="leading-relaxed mb-2">
            De conformidad con la Ley Federal de Protección al Consumidor (PROFECO):
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              Cuenta con <strong>5 días hábiles</strong> a partir de la recepción para
              solicitar devolución por arrepentimiento.
            </li>
            <li>
              El producto debe estar en su <strong>empaque original, sin uso y con todos
              sus accesorios</strong>.
            </li>
            <li>
              Por motivos de higiene, no se aceptan devoluciones de productos para
              alimentación, mordederas o productos de uso íntimo.
            </li>
            <li>
              Si el producto llega <strong>defectuoso o dañado</strong>, deberá notificarlo
              dentro de las primeras 48 horas mediante fotografías al correo
              hola@mundo-infantil.lat
            </li>
            <li>
              Los reembolsos se procesan en un plazo de 5 a 10 días hábiles a través
              del mismo método de pago utilizado.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-fredoka text-2xl font-bold text-[#FF6B6B] mb-3">
            7. Cuenta de Usuario
          </h2>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              El usuario es responsable de mantener la confidencialidad de su
              contraseña.
            </li>
            <li>
              Está prohibido proporcionar información falsa o suplantar identidad de
              terceros.
            </li>
            <li>
              Para crear una cuenta debe ser mayor de edad. Los menores deben contar
              con autorización de padre, madre o tutor.
            </li>
            <li>
              Nos reservamos el derecho de suspender o cancelar cuentas que infrinjan
              estos términos.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-fredoka text-2xl font-bold text-[#FF6B6B] mb-3">
            8. Programa de Recompensas
          </h2>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              Los puntos se acumulan a razón de <strong>1 punto por cada $1 MXN</strong>
              en compras pagadas.
            </li>
            <li>
              Los niveles (Bronce, Plata, Oro) y sus beneficios son determinados por
              Mundo Infantil y pueden modificarse con previo aviso.
            </li>
            <li>
              Los puntos no son canjeables por dinero, no son transferibles entre
              cuentas y pueden expirar después de 12 meses sin actividad.
            </li>
            <li>
              Las devoluciones de productos descuentan los puntos correspondientes.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-fredoka text-2xl font-bold text-[#FF6B6B] mb-3">
            9. Propiedad Intelectual
          </h2>
          <p className="leading-relaxed">
            Todo el contenido del Sitio (textos, imágenes, logotipos, diseño) es
            propiedad de Mundo Infantil o de sus respectivos titulares. Queda
            prohibida su reproducción, distribución o modificación sin autorización
            expresa por escrito.
          </p>
          <p className="leading-relaxed mt-2">
            Las marcas de los juguetes (LEGO, Barbie, Hot Wheels, Peppa Pig, etc.)
            son propiedad de sus respectivos titulares y se utilizan únicamente con
            fines descriptivos.
          </p>
        </section>

        <section>
          <h2 className="font-fredoka text-2xl font-bold text-[#FF6B6B] mb-3 flex items-center gap-2">
            <AlertCircle size={24} /> 10. Limitación de Responsabilidad
          </h2>
          <p className="leading-relaxed">
            Mundo Infantil no se hace responsable por:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
            <li>Daños indirectos derivados del uso o imposibilidad de uso del Sitio</li>
            <li>Interrupciones temporales del servicio por mantenimiento o causas de fuerza mayor</li>
            <li>Uso inadecuado de los productos por parte del comprador</li>
            <li>Edad recomendada incorrectamente seleccionada (verifique siempre la edad sugerida del juguete)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-fredoka text-2xl font-bold text-[#FF6B6B] mb-3 flex items-center gap-2">
            <Scale size={24} /> 11. Legislación y Jurisdicción
          </h2>
          <p className="leading-relaxed">
            Para todo lo relacionado con la interpretación y cumplimiento de los
            presentes Términos y Condiciones, las partes se someten expresamente a
            las leyes de los Estados Unidos Mexicanos, particularmente a la
            <strong> Ley Federal de Protección al Consumidor</strong>, y a la
            jurisdicción de los tribunales competentes de Ciudad Miguel Alemán,
            Tamaulipas, México.
          </p>
        </section>

        <section>
          <h2 className="font-fredoka text-2xl font-bold text-[#FF6B6B] mb-3">
            12. Contacto y Atención al Cliente
          </h2>
          <p className="leading-relaxed mb-3">
            Para cualquier duda, queja o aclaración:
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="p-4 bg-[#F9F9F9] rounded-2xl">
              <p className="text-xs text-[#4B5563] uppercase font-fredoka">Teléfono</p>
              <p className="font-fredoka text-lg font-bold text-[#4CAFEE]">897 107 6125</p>
            </div>
            <div className="p-4 bg-[#F9F9F9] rounded-2xl">
              <p className="text-xs text-[#4B5563] uppercase font-fredoka">Correo</p>
              <p className="font-fredoka text-base font-bold text-[#4CAFEE]">hola@mundo-infantil.lat</p>
            </div>
          </div>
          <p className="text-sm text-[#4B5563] mt-4 leading-relaxed">
            <strong>PROFECO:</strong> En caso de queja no resuelta, puede acudir a la
            Procuraduría Federal del Consumidor al teléfono 55 5568 8722 o en
            <a href="https://www.gob.mx/profeco" target="_blank" rel="noreferrer"
               className="text-[#4CAFEE] hover:underline ml-1">www.gob.mx/profeco</a>.
          </p>
        </section>

        <section className="pt-4 border-t border-[#E5E7EB]">
          <p className="text-sm text-[#4B5563] italic leading-relaxed">
            Al realizar una compra o crear una cuenta en este Sitio, usted manifiesta
            haber leído, entendido y aceptado en su totalidad los presentes Términos
            y Condiciones, así como nuestro Aviso de Privacidad.
          </p>
        </section>
      </div>
    </div>
  );
}

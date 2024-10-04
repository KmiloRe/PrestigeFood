import { ref, get, set, update, remove } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";
import { auth, database } from './firebase-config.js';

var carritoVisible = false;
var isPaymentComplete = false; // Agregamos esta variable

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
} else {
    ready();
}

function ready() {
    var botonesEliminarItem = document.getElementsByClassName('btn-eliminar');
    for (var i = 0; i < botonesEliminarItem.length; i++) {
        var button = botonesEliminarItem[i];
        button.addEventListener('click', eliminarItemCarrito);
    }

    var botonesSumarCantidad = document.getElementsByClassName('sumar-cantidad');
    for (var i = 0; i < botonesSumarCantidad.length; i++) {
        var button = botonesSumarCantidad[i];
        button.addEventListener('click', sumarCantidad);
    }

    var botonesRestarCantidad = document.getElementsByClassName('restar-cantidad');
    for (var i = 0; i < botonesRestarCantidad.length; i++) {
        var button = botonesRestarCantidad[i];
        button.addEventListener('click', restarCantidad);
    }

    var botonesAgregarAlCarrito = document.getElementsByClassName('boton-item');
    for (var i = 0; i < botonesAgregarAlCarrito.length; i++) {
        var button = botonesAgregarAlCarrito[i];
        button.addEventListener('click', agregarAlCarritoClicked);
    }

    document.getElementsByClassName('btn-pagar')[0].addEventListener('click', pagarClicked);
}

async function pagarClicked() {
    const user = auth.currentUser;

    if (!user) {
        alert("Por favor, inicia sesión para realizar la compra.");
        return;
    }

    const userId = user.uid;
    const cartRef = ref(database, 'carts/' + userId + '/products');
    const snapshot = await get(cartRef);

    if (snapshot.exists()) {
        const products = snapshot.val();

        // Actualizar cada producto en la base de datos principal
        for (const productKey in products) {
            const productData = products[productKey];
            const productQuantity = productData.quantity;

            // Incrementar la cantidad del producto en la base de datos principal
            const mainProductRef = ref(database, 'products/' + productKey);
            const mainProductSnapshot = await get(mainProductRef);

            if (mainProductSnapshot.exists()) {
                const mainProductData = mainProductSnapshot.val();
                const newQuantity = (mainProductData.quantity || 0) + productQuantity;
                await update(mainProductRef, { quantity: newQuantity });
            } else {
                // Si no existe el producto principal, agregarlo
                await set(mainProductRef, { name: productData.name, image: productData.image, quantity: productQuantity });
            }
        }

        alert("Gracias por la compra");

        // Limpiar el carrito en la interfaz
        var carritoItems = document.getElementsByClassName('carrito-items')[0];
        while (carritoItems.hasChildNodes()) {
            carritoItems.removeChild(carritoItems.firstChild);
        }

        // Vaciar el carrito en la base de datos
        await remove(cartRef);

        // Habilitar la opción de agregar al carrito
        isPaymentComplete = true; // Establecer como verdadero después del pago
    } else {
        alert("El carrito está vacío.");
    }

    ocultarCarrito();
}

async function agregarAlCarritoClicked(event) {
    const user = auth.currentUser;

    if (!user) {
        alert("Por favor, inicia sesión para agregar productos al carrito.");
        return;
    }

    // Quitar la verificación de si el pago está completo
    // if (!isPaymentComplete) { // Verificar si el pago está completo
    //    alert("Por favor, complete el pago antes de agregar productos al carrito.");
    //    return;
    // }

    var button = event.target;
    var item = button.parentElement;
    var titulo = item.getElementsByClassName('titulo-item')[0].innerText;
    var imagenSrc = item.getElementsByClassName('img-item')[0].src;

    agregarItemAlCarrito(titulo, imagenSrc);
    hacerVisibleCarrito();

    const userId = user.uid;
    const productRef = ref(database, 'carts/' + userId + '/products/' + titulo);

    try {
        const productSnapshot = await get(productRef);

        if (productSnapshot.exists()) {
            const currentQuantity = productSnapshot.val().quantity;
            update(productRef, { quantity: currentQuantity + 1 });
        } else {
            set(productRef, { name: titulo, image: imagenSrc, quantity: 1 });
        }
    } catch (error) {
        console.error("Error añadiendo producto al carrito:", error);
        alert("Error añadiendo producto al carrito: " + error.message);
    }
}

function hacerVisibleCarrito() {
    carritoVisible = true;
    var carrito = document.getElementsByClassName('carrito')[0];
    carrito.style.marginRight = '0';
    carrito.style.opacity = '1';

    var items = document.getElementsByClassName('contenedor-items')[0];
    items.style.width = '60%';
}

function agregarItemAlCarrito(titulo, imagenSrc) {
    var item = document.createElement('div');
    item.classList.add('item');
    var itemsCarrito = document.getElementsByClassName('carrito-items')[0];

    var nombresItemsCarrito = itemsCarrito.getElementsByClassName('carrito-item-titulo');
    for (var i = 0; i < nombresItemsCarrito.length; i++) {
        if (nombresItemsCarrito[i].innerText === titulo) {
            alert("El item ya se encuentra en el carrito.");
            return;
        }
    }

    var itemCarritoContenido = `
        <div class="carrito-item">
            <img src="${imagenSrc}" width="80px" alt="">
            <div class="carrito-item-detalles">
                <span class="carrito-item-titulo">${titulo}</span>
                <div class="selector-cantidad">
                    <i class="fa-solid fa-minus restar-cantidad"></i>
                    <input type="text" value="1" class="carrito-item-cantidad" disabled>
                    <i class="fa-solid fa-plus sumar-cantidad"></i>
                </div>
                <button class="btn-eliminar">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    item.innerHTML = itemCarritoContenido;
    itemsCarrito.append(item);

    item.getElementsByClassName('btn-eliminar')[0].addEventListener('click', eliminarItemCarrito);
    item.getElementsByClassName('sumar-cantidad')[0].addEventListener('click', sumarCantidad);
    item.getElementsByClassName('restar-cantidad')[0].addEventListener('click', restarCantidad);
}

function sumarCantidad(event) {
    var buttonClicked = event.target;
    var selector = buttonClicked.parentElement;
    var cantidadActual = selector.getElementsByClassName('carrito-item-cantidad')[0].value;
    cantidadActual++;
    selector.getElementsByClassName('carrito-item-cantidad')[0].value = cantidadActual;

    actualizarCantidadFirebase(selector, cantidadActual);
}

function restarCantidad(event) {
    var buttonClicked = event.target;
    var selector = buttonClicked.parentElement;
    var cantidadActual = selector.getElementsByClassName('carrito-item-cantidad')[0].value;
    cantidadActual--;

    if (cantidadActual >= 1) {
        selector.getElementsByClassName('carrito-item-cantidad')[0].value = cantidadActual;
    }

    actualizarCantidadFirebase(selector, cantidadActual);
}

function actualizarCantidadFirebase(selector, cantidadActual) {
    var tituloItem = selector.parentElement.getElementsByClassName('carrito-item-titulo')[0].innerText;
    const user = auth.currentUser;

    if (!user) {
        return;
    }

    const userId = user.uid;
    const productRef = ref(database, 'carts/' + userId + '/products/' + tituloItem);

    if (cantidadActual >= 1) {
        update(productRef, { quantity: cantidadActual });
    } else {
        remove(productRef);
    }
}

function eliminarItemCarrito(event) {
    var buttonClicked = event.target;
    buttonClicked.parentElement.parentElement.parentElement.remove();

    const user = auth.currentUser;

    if (!user) {
        return;
    }

    var tituloItem = buttonClicked.parentElement.getElementsByClassName('carrito-item-titulo')[0].innerText;
    const userId = user.uid;
    const productRef = ref(database, 'carts/' + userId + '/products/' + tituloItem);
    remove(productRef);

    ocultarCarrito();
}

function ocultarCarrito() {
    var carritoItems = document.getElementsByClassName('carrito-items')[0];
    if (carritoItems.childElementCount === 0) {
        var carrito = document.getElementsByClassName('carrito')[0];
        carrito.style.marginRight = '-100%';
        carrito.style.opacity = '0';
        carritoVisible = false;

        var items = document.getElementsByClassName('contenedor-items')[0];
        items.style.width = '100%';
    }
}

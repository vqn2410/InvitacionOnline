import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBTk84_UsgYfi8ihPxWEU_GbTLZ5OEozFM",
    authDomain: "invitacion-4c505.firebaseapp.com",
    projectId: "invitacion-4c505",
    storageBucket: "invitacion-4c505.firebasestorage.app",
    messagingSenderId: "217343814641",
    appId: "1:217343814641:web:116c0ba0c15827b915f250",
    measurementId: "G-0WHWWJ5RRW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Admin Elements
const adminSubmit = document.getElementById('admin-submit');
const adminPassword = document.getElementById('admin-password');
const adminError = document.getElementById('admin-error');
const adminLoginSection = document.getElementById('admin-login-section');
const adminDashboardSection = document.getElementById('admin-dashboard-section');
const guestsTbody = document.getElementById('guests-tbody');
const clearGuestsBtn = document.getElementById('clear-guests');
const printGuestsBtn = document.getElementById('print-guests');

adminSubmit.addEventListener('click', () => {
    if (adminPassword.value === 'Admin123@') {
        adminError.classList.add('hidden');
        adminLoginSection.classList.add('hidden');
        adminDashboardSection.classList.remove('hidden');
        renderAdminDashboard();
    } else {
        adminError.classList.remove('hidden');
    }
});

adminPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        adminSubmit.click();
    }
});

let allRSVPs = [];

async function renderAdminDashboard() {
    guestsTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--gold);">Cargando confirmaciones...</td></tr>';

    try {
        const querySnapshot = await getDocs(collection(db, "rsvps"));
        const data = [];
        querySnapshot.forEach((document) => {
            data.push({ id: document.id, ...document.data() });
        });
        
        data.sort((a, b) => a.name.localeCompare(b.name));
        
        allRSVPs = data;

        guestsTbody.innerHTML = '';

        let totalAdults = 0;
        let totalChildren = 0;

        if (data.length === 0) {
            guestsTbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay confirmaciones aún.</td></tr>';
            document.getElementById('count-adults').innerText = "0";
            document.getElementById('count-children').innerText = "0";
            return;
        }

        data.forEach(guest => {
            let extraInfo = '-';

            if (guest.attending === 'Sí') {
                totalAdults++;

                if (guest.extraGuests && guest.extraGuests.length > 0) {
                    extraInfo = guest.extraGuests.map(eg => {
                        if (eg.type === 'Adulto') {
                            totalAdults++;
                        } else if (eg.type === 'Niño/a') {
                            totalChildren++;
                        }
                        return `&bull; ${eg.name} <i>(${eg.type})</i>`;
                    }).join('<br>');
                }
            }

            if (guest.arrived === undefined) guest.arrived = false;

            const row = `
                <tr class="guest-row-item" data-name="${guest.name.toLowerCase()}">
                    <td><strong>${guest.name}</strong></td>
                    <td><span style="color: ${guest.attending === 'Sí' ? '#2ecc71' : '#e74c3c'}; font-weight: bold;">${guest.attending}</span></td>
                    <td>${guest.numGuests}</td>
                    <td class="extra-info-cell">${extraInfo}</td>
                    <td>
                        <input type="checkbox" class="check-in-btn" data-id="${guest.id}" style="width: 22px; height: 22px; accent-color: #2ecc71; cursor: pointer;" ${guest.arrived ? 'checked' : ''} ${guest.attending === 'No' ? 'disabled' : ''}>
                    </td>
                    <td class="hide-on-print">
                        <button class="btn btn-primary edit-guest-btn" data-id="${guest.id}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; margin-right: 5px;" aria-label="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-outline delete-guest-btn" data-id="${guest.id}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" aria-label="Eliminar"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
            guestsTbody.insertAdjacentHTML('beforeend', row);
        });

        document.getElementById('count-adults').innerText = totalAdults;
        document.getElementById('count-children').innerText = totalChildren;

        document.querySelectorAll('.delete-guest-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if (confirm('¿Estás seguro de eliminar este invitado?')) {
                    const prevIcon = e.currentTarget.innerHTML;
                    e.currentTarget.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    try {
                        await deleteDoc(doc(db, "rsvps", id));
                        renderAdminDashboard();
                    } catch (error) {
                        console.error("Error al eliminar:", error);
                        alert("Error al eliminar");
                        e.currentTarget.innerHTML = prevIcon;
                    }
                }
            });
        });

        document.querySelectorAll('.edit-guest-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const guest = data.find(g => g.id === id);
                if (guest) {
                    openEditModal(guest);
                }
            });
        });

        document.querySelectorAll('.check-in-btn').forEach(btn => {
            btn.addEventListener('change', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const isChecked = e.currentTarget.checked;
                try {
                    await updateDoc(doc(db, "rsvps", id), { arrived: isChecked });
                } catch (error) {
                    console.error("Error al actualizar llegada:", error);
                    alert("No se pudo actualizar el estado de llegada");
                    e.currentTarget.checked = !isChecked; // Revert
                }
            });
        });

        const searchInput = document.getElementById('search-guest');
        if (searchInput && !searchInput.dataset.hasListener) {
            searchInput.dataset.hasListener = "true"; // Prevent multiple listeners
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                document.querySelectorAll('.guest-row-item').forEach(row => {
                    const name = row.getAttribute('data-name') || '';
                    const details = row.querySelector('.extra-info-cell') ? row.querySelector('.extra-info-cell').innerText.toLowerCase() : '';
                    if (name.includes(query) || details.includes(query)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
            // Auto search if input already has value when reloading
            searchInput.dispatchEvent(new Event('input'));
        }

    } catch (e) {
        guestsTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error al cargar datos.</td></tr>';
        console.error(e);
    }
}

const editModal = document.getElementById('edit-modal');
const closeEditBtn = document.getElementById('close-edit');
const editForm = document.getElementById('edit-form');
const editId = document.getElementById('edit-id');
const editName = document.getElementById('edit-name');
const editAttend = document.getElementById('edit-attend');
const editGuestsInput = document.getElementById('edit-guests');
const editGuestsGroup = document.getElementById('edit-guests-group');
const editDynamicGuestsContainer = document.getElementById('edit-dynamic-guests-container');

function openEditModal(guest) {
    editId.value = guest.id;
    editName.value = guest.name;
    editAttend.value = guest.attending;
    editGuestsInput.value = guest.numGuests || 0;
    
    if (guest.attending === 'Sí') {
        editGuestsGroup.style.display = 'block';
    } else {
        editGuestsGroup.style.display = 'none';
        editGuestsInput.value = 0;
    }

    renderEditDynamicGuests(guest.extraGuests || []);
    editModal.classList.remove('hidden');
}

if (closeEditBtn) {
    closeEditBtn.addEventListener('click', () => {
        editModal.classList.add('hidden');
    });
}

if (editAttend) {
    editAttend.addEventListener('change', (e) => {
        if (e.target.value === 'Sí') {
            editGuestsGroup.style.display = 'block';
        } else {
            editGuestsGroup.style.display = 'none';
            editGuestsInput.value = 0;
            editDynamicGuestsContainer.innerHTML = '';
        }
    });
}

if (editGuestsInput) {
    editGuestsInput.addEventListener('input', (e) => {
        const num = parseInt(e.target.value) || 0;
        const currentExtraGuests = getEditDynamicGuestsData();
        const newExtraGuests = [];
        for (let i = 0; i < num; i++) {
            if (i < currentExtraGuests.length) {
                newExtraGuests.push(currentExtraGuests[i]);
            } else {
                newExtraGuests.push({ name: '', type: '' });
            }
        }
        renderEditDynamicGuests(newExtraGuests);
    });
}

function getEditDynamicGuestsData() {
    const guestNames = editDynamicGuestsContainer.querySelectorAll('.guest-name');
    const guestTypes = editDynamicGuestsContainer.querySelectorAll('.guest-type');
    const extraGuests = [];
    for (let i = 0; i < guestNames.length; i++) {
        extraGuests.push({
            name: guestNames[i].value,
            type: guestTypes[i].value
        });
    }
    return extraGuests;
}

function renderEditDynamicGuests(extraGuests) {
    editDynamicGuestsContainer.innerHTML = '';
    extraGuests.forEach((guest, index) => {
        const i = index + 1;
        const guestHtml = `
            <div class="dynamic-guest fade-in-up" style="background: rgba(0,0,0,0.2); border: 1px dashed rgba(212, 175, 55, 0.4); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <p style="color: var(--gold); margin-bottom: 0.5rem; font-size: 0.9rem;">Acompañante #${i}</p>
                <div class="guest-row" style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <div class="form-group" style="margin-bottom: 0; flex: 1; min-width: 120px;">
                        <input type="text" class="guest-name" value="${guest.name}" required placeholder="Nombre y Apellido" autocomplete="off" style="width: 100%;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0; flex: 1; min-width: 120px;">
                        <select class="guest-type" required style="width: 100%;">
                            <option value="" disabled ${!guest.type ? 'selected' : ''}>Seleccioná si es...</option>
                            <option value="Adulto" ${guest.type === 'Adulto' ? 'selected' : ''}>Adulto</option>
                            <option value="Niño/a" ${guest.type === 'Niño/a' ? 'selected' : ''}>Niño/a</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        editDynamicGuestsContainer.insertAdjacentHTML('beforeend', guestHtml);
    });
}

if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = editId.value;
        const btn = editForm.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        
        const isAttending = editAttend.value;
        const numGuests = parseInt(editGuestsInput.value) || 0;
        
        let extraGuests = [];
        if (isAttending === 'Sí' && numGuests > 0) {
            extraGuests = getEditDynamicGuestsData();
        }
        
        const updateData = {
            name: editName.value,
            attending: isAttending,
            numGuests: isAttending === 'Sí' ? numGuests : 0,
            extraGuests: extraGuests
        };
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        btn.disabled = true;
        
        try {
            await updateDoc(doc(db, "rsvps", id), updateData);
            editModal.classList.add('hidden');
            renderAdminDashboard();
        } catch (error) {
            console.error("Error al actualizar: ", error);
            alert("Hubo un error al actualizar.");
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

clearGuestsBtn.addEventListener('click', async () => {
    if (confirm('¿Estás seguro de que deseas borrar toda la lista de invitados? Esta acción no se puede deshacer.')) {
        const prevText = clearGuestsBtn.innerHTML;
        clearGuestsBtn.innerHTML = "Borrando...";
        try {
            const querySnapshot = await getDocs(collection(db, "rsvps"));
            const deletePromises = [];
            querySnapshot.forEach((document) => {
                deletePromises.push(deleteDoc(doc(db, "rsvps", document.id)));
            });
            await Promise.all(deletePromises);
            renderAdminDashboard();
        } catch (e) {
            console.error(e);
            alert("Hubo un error al borrar.");
        }
        clearGuestsBtn.innerHTML = prevText;
    }
});

function generatePrintLists() {
    const adultsTbody = document.getElementById('print-adults-tbody');
    const childrenTbody = document.getElementById('print-children-tbody');
    
    adultsTbody.innerHTML = '';
    childrenTbody.innerHTML = '';
    
    let printAdultsList = [];
    let printChildrenList = [];
    
    allRSVPs.forEach(guest => {
        if (guest.attending === 'Sí') {
            // Main guest is an adult
            printAdultsList.push({
                name: guest.name,
                note: 'Principal'
            });
            
            if (guest.extraGuests && guest.extraGuests.length > 0) {
                guest.extraGuests.forEach(eg => {
                    if (eg.type === 'Adulto') {
                        printAdultsList.push({
                            name: eg.name || 'Sin nombre',
                            note: `Acompañante de ${guest.name}`
                        });
                    } else if (eg.type === 'Niño/a') {
                        printChildrenList.push({
                            name: eg.name || 'Sin nombre',
                            note: `Hijo/a de ${guest.name}`
                        });
                    }
                });
            }
        }
    });

    // Sort both arrays alphabetically by name
    printAdultsList.sort((a, b) => a.name.localeCompare(b.name));
    printChildrenList.sort((a, b) => a.name.localeCompare(b.name));
    
    // Render adults
    printAdultsList.forEach(adult => {
        adultsTbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td style="border-bottom: 1px solid #ccc; padding: 6px;"><strong>${adult.name}</strong></td>
                <td style="border-bottom: 1px solid #ccc; padding: 6px; color: #555; font-size: 0.9em;">${adult.note}</td>
            </tr>
        `);
    });

    // Render children
    printChildrenList.forEach(child => {
        childrenTbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td style="border-bottom: 1px solid #ccc; padding: 6px;"><strong>${child.name}</strong></td>
                <td style="border-bottom: 1px solid #ccc; padding: 6px; color: #555; font-size: 0.9em;">${child.note}</td>
            </tr>
        `);
    });
    
    let printAdults = printAdultsList.length;
    let printChildren = printChildrenList.length;

    if (printAdults === 0) adultsTbody.innerHTML = '<tr><td colspan="2" style="padding: 10px;">No hay adultos confirmados</td></tr>';
    if (printChildren === 0) childrenTbody.innerHTML = '<tr><td colspan="2" style="padding: 10px;">No hay niños/as confirmados</td></tr>';

    document.getElementById('print-total-adults').innerText = printAdults;
    document.getElementById('print-total-children').innerText = printChildren;
}

printGuestsBtn.addEventListener('click', () => {
    generatePrintLists();
    window.print();
});

function get(table, id) {
    return new Promise(async (resolve, reject) => {
        await fetch(`/api?table=${table}${id ? `&id=${id}` : ''}`)
            .catch(error => reject(error))
            .then(async res => {
                res = await res.json();
                if (res.success) resolve(res.results);
                else reject(res.error);
            });
    });
}

function put(table, data) {
    return new Promise(async (resolve, reject) => {
        await fetch(`/api?table=${table}`, {
                body: JSON.stringify(data),
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .catch(error => reject(error))
            .then(async res => {
                res = await res.json();
                if (res.success) resolve(res.results);
                else reject(res.error);
            });
    });
}

function deleteRow(table, id) {
    return new Promise(async (resolve, reject) => {
        await fetch(`/api?table=${table}&id=${id}`, {
                method: 'DELETE',
            })
            .catch(error => reject(error))
            .then(async res => {
                res = await res.json();
                if (res.success) resolve(res.results);
                else reject(res.error);
            });
    });
}

function edit(table, id, data) {
    return new Promise(async (resolve, reject) => {
        await fetch(`/api?table=${table}&id=${id}`, {
                body: JSON.stringify(data),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .catch(error => reject(error))
            .then(async res => {
                res = await res.json();
                if (res.success) resolve(res.results);
                else reject(res.error);
            });
    });
}

const modal = new bootstrap.Modal(document.getElementById('modal'));
async function editRow(table, id) {
    const dataToEdit = (await get(table, id))[0];
    openModal('Редактировать', dataToEdit);
}

function modalAdd() {
    document.querySelector('#buttonAdd').onclick = async function () {
        const data = getValuesObject('#add input, #add select');
        await put(config.table, data)
        .then(res => {
            clearForm('#add input, #add select');
            update(config.table);
        }).catch(error => {
            alert(`Не удалось добавить новый элемент: ${JSON.stringify(error)}`);
        });
    }
}

function modalEdit(id) {
    document.querySelector('#buttonAdd').onclick = async function () {
        const data = getValuesObject('#add input, #add select');
        await edit(config.table, id, data)
        .then(res => {
            clearForm('#add input, #add select');
            update(config.table);
            modalAdd();
        }).catch(error => {
            alert(`Не удалось изменить элемент: ${JSON.stringify(error)}`);
        });
    }
}

function openModal(title, data) {
    document.querySelector('h5.modal-title').innerText = title;

    if (data) {
        for (let key of Object.keys(data)) {
            const value = data[key];
            const isInput = !/_id/.test(key);
            const element = document.querySelector(`form ${isInput ? 'input' : 'select'}[name="${key}"]`);
            if (!element) continue;
            element.value = value;
        }

        modalEdit(data.id);
    }

    else {
        clearForm('#add input, #add select');
    }

    modal.show();
}

async function print(items, table) {
    const tbody = document.querySelector('tbody');
    [...tbody.querySelectorAll('tr')].map(item => item.remove());
    for (let index in items) {
        const item = items[index];
        const buttons = `
        <td>    
            <button type="button" class="btn btn-secondary btn-sm me-1" onclick="
                (async () => {
                    await editRow('${table}', ${item.id});
                })();
            ">Изменить</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="
                (async () => {
                    await deleteRow('${table}', ${item.id}).then(() => update('${table}'));
                })();
            ">Удалить</button>
        </td>
        `;

        let html = `<tr><td>${parseInt(index) + 1}</td>`;
        for (let key of Object.keys(item).slice(1)) {
            const value = item[key];
            if (!/_id/.test(key)) {
                html += `<td>${value}</td>`;
                continue;
            }
            
            const fromTable = key.replace('_id', 's');
            const formatter = config.format.filter(i => i[0] === fromTable)[0][2];
            
            let output = await get(fromTable, value);
            output = output && output[0] ? formatter(output[0]) : 'Ошибка';
            html += `<td>${output}</td>`;
        }

        html += `${buttons}</tr>`;
        tbody.insertAdjacentHTML('beforeend', html);
    }
}

async function update(table) {
    try {
        const items = await get(table);
        print(items, table);
    } 
    
    catch (error) {
        alert(`Не удалось обновить таблицу: ${error}`);
        return;
    }
}

function getValuesObject(selector) {
    return [...document.querySelectorAll(selector)].reduce((acc, item) => {
        acc[item.name] = item.value;
        return acc;
    }, {});
}

function clearForm(selector) {
    [...document.querySelectorAll(selector)].map(item => item.value = '');
}

(async () => {
    document.title = config.title;
    document.querySelector('h1#title').innerText = config.title;
    const tableHeader = document.querySelector('table thead tr');
    config.tableHeaders.push('');

    for (let header of config.tableHeaders) {
        const element = `<th scope="col">${header}</th>`;
        tableHeader.insertAdjacentHTML('beforeend', element);
    }

    await update(config.table);
    const form = document.querySelector('form#add');
    for (let i in config.fields) {
        const field = config.fields[i];
        const isInput = !/_id/.test(field);
        const elementId = `${field}${isInput ? 'Input' : 'Select'}`;
        const title = config.tableHeaders[parseInt(i) + 1];
        const label = `<label for="${elementId}" class="form-label">${title}</label>`;
        const element = 
            isInput ? `<input name="${field}" type="text" class="form-control" id="${elementId}">`
            : `<select name="${field}" class="form-select form-select-lg mb-3" aria-label=".form-select-lg" id="${elementId}"></select>`;
        
        form.insertAdjacentHTML('beforeend', `<div class="mb-3">${label}${element}</div>`);
    }

    document.querySelector('button#buttonOpenModal').onclick = function() {
        modalAdd();
        openModal('Добавить');
    }

    for (let [table, title, format] of config.format) {
        try {
            await get(table).then(list => {
                const select = document.querySelector(`select[name="${table.slice(0, -1)}_id"]`);
                for (let item of list) {
                    const element = `<option value="${item.id}">${format(item)}</option>`;
                    select.insertAdjacentHTML('beforeend', element);
                }
            });
        } catch (error) {
            alert(`Не удалось получить список ${title}: ${error}`);
        }
    }
})();
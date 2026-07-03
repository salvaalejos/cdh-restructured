const formData = new FormData();
formData.append('username', 'testuser');
formData.append('password', 'testpass');
formData.append('name', 'Test User');
formData.append('roleId', '2');
formData.append('permissions', JSON.stringify({}));

fetch('http://localhost:3000/api/users', {
    method: 'POST',
    body: formData
})
.then(res => res.text().then(text => ({ status: res.status, text })))
.then(console.log)
.catch(console.error);

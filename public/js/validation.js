document.getElementById('password-reset-form').addEventListener('submit', function(event) {
    event.preventDefault();
    let password = document.getElementById('password').value;
    let passwordVerify = document.getElementById('password-verify').value;

    if (password !== passwordVerify) {
        document.getElementById('alert').innerText = 'Passwords do not match!';
        document.getElementById('alert').style.display = 'block';
        return;
    }

    fetch('/api/resetPassword', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userID: getUserIDFromURL(), resetString: getResetStringFromURL(), newPassword: password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'FAILED') {
            document.getElementById('alert').innerText = data.message;
            document.getElementById('alert').style.display = 'block';
        } else {
            alert('Password reset successful!');
            window.location.href = 'index.html';
        }
    });
});

function getUserIDFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('userID');
}

function getResetStringFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('resetString');
}

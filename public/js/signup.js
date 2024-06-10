document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault();
    let username = document.getElementById('username').value;
    let email = document.getElementById('signup_email').value;
    let password = document.getElementById('signup_pass').value;

    fetch('/user/api/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'FAILED') {
            alert(data.message);
        } else {
            alert('Sign up successful! Please check your email to verify your account.');
            window.location.href = 'index.html';
        }
    });
});

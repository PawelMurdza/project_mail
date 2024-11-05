document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Handle form submission
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show the compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Hide archive and reply buttons in compose view
  document.querySelector('#archive-button').style.display = 'none';
  document.querySelector('#reply-button').style.display = 'none';
}


function send_email(event) {
  event.preventDefault();

  // Get form data
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Send POST request to /emails
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({ recipients, subject, body }),
  })
    .then(response => response.json())
    .then(result => {
      console.log(result);
      load_mailbox('sent'); // Redirect to sent mailbox
    });
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Fetch emails for the mailbox
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      emails.forEach(email => {
        // Create div for each email and set content
        const emailDiv = document.createElement('div');
        emailDiv.className = 'email-item';
        emailDiv.innerHTML = `
          <strong>${email.sender}</strong> ${email.subject}
          <span class="text-muted">${email.timestamp}</span>
        `;

        // Apply different background colors based on read status
        emailDiv.classList.add(email.read ? 'read-email' : 'unread-email');

        // Add click event to view the email
        emailDiv.addEventListener('click', () => view_email(email.id, mailbox));

        // Append email to the container
        document.querySelector('#emails-view').append(emailDiv);
      });
    });
}

function view_email(id, mailbox) {
  // Show email detail view, hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'block';

  // Fetch the email details
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      // Create and populate email detail content
      const emailDiv = document.createElement('div');
      emailDiv.innerHTML = `
        <h3>${email.subject}</h3>
        <p><strong>From:</strong> ${email.sender}</p>
        <p><strong>To:</strong> ${email.recipients.join(', ')}</p>
        <p><strong>Time:</strong> ${email.timestamp}</p>
        <hr>
        <p style="white-space: pre-wrap;">${email.body}</p>`;

      // Add Archive/Unarchive button if not in Sent mailbox
      if (mailbox !== 'sent') {
        const archiveButton = document.createElement('button');
        archiveButton.className = 'btn btn-sm btn-outline-secondary';
        archiveButton.innerText = email.archived ? 'Unarchive' : 'Archive';

        archiveButton.addEventListener('click', () => toggle_archive(id, !email.archived));
        emailDiv.appendChild(archiveButton);
      }

      // Add Reply button
      const replyButton = document.createElement('button');
      replyButton.className = 'btn btn-sm btn-outline-primary';
      replyButton.innerText = 'Reply';
      replyButton.addEventListener('click', () => reply_email(email));
      emailDiv.appendChild(replyButton);

      // Clear and append the new email details
      document.querySelector('#email-detail-view').innerHTML = '';
      document.querySelector('#email-detail-view').append(emailDiv);

      // Mark the email as read
      if (!email.read) {
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ read: true }),
        });
      }
    });
}

function toggle_archive(id, archive) {
  // Send PUT request to archive/unarchive the email
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ archived: archive })
  })
  .then(() => load_mailbox('inbox')); // Refresh to the inbox after archiving
}

function reply_email(email) {
  // Show the compose view
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Pre-fill the form fields
  document.querySelector('#compose-recipients').value = email.sender;
  document.querySelector('#compose-subject').value = email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`;

  // Pre-fill the body with a newline before the previous message
  document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp}, ${email.sender} wrote:\n> ${email.body.replace(/\n/g, '\n> ')}`;

  // Hide Archive and Reply buttons in compose view
  document.querySelector('#archive-button').style.display = 'none';
  document.querySelector('#reply-button').style.display = 'none';
}







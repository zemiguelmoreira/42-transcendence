function makeProfilePage( data ) {
	return `
	<div class="container my-5">
        <h1>${data.username}</h1>
        <p>Email: ${data.email}</p>
        <p>Photo Path: ${data.photo_path}</p>
	</div>
     <div class="bcontainer my-5">
        <button id="change-account" class="button change-data">Change Data</button>
        <button id="delete-account" class="button delete-account">Delete Account</button>
    </div>
    `;
}


export { makeProfilePage }
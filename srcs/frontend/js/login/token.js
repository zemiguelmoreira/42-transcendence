async function criptografar(token) {
	const chaveCriptografia = await window.crypto.subtle.generateKey(
	  {
		name: "AES-CBC",
		length: 256
	  },
	  true,
	  ["encrypt", "decrypt"]
	);
  
	const vetorInicializacao = window.crypto.getRandomValues(new Uint8Array(16));
  
	const tokenArray = new TextEncoder().encode(token);
  
	const tokenCriptografadoArray = await window.crypto.subtle.encrypt(
	  {
		name: "AES-CBC",
		iv: vetorInicializacao
	  },
	  chaveCriptografia,
	  tokenArray
	);
  
	const tokenCriptografado = Array.from(new Uint8Array(tokenCriptografadoArray)).map(byte => String.fromCharCode(byte)).join('');
	
	return btoa(tokenCriptografado);
  }

  async function descriptografar(tokenCriptografado) {
	const chaveCriptografia = await window.crypto.subtle.generateKey(
	  {
		name: "AES-CBC",
		length: 256
	  },
	  true,
	  ["encrypt", "decrypt"]
	);
  
	const vetorInicializacao = window.crypto.getRandomValues(new Uint8Array(16));
  
	const tokenCriptografadoArray = new Uint8Array(atob(tokenCriptografado).split('').map(char => char.charCodeAt(0)));
  
	const tokenDescriptografadoArray = await window.crypto.subtle.decrypt(
	  {
		name: "AES-CBC",
		iv: vetorInicializacao
	  },
	  chaveCriptografia,
	  tokenCriptografadoArray
	);
  
	const tokenDescriptografado = new TextDecoder().decode(tokenDescriptografadoArray);
  
	return tokenDescriptografado;
  }
  
  // Exemplo de uso:
  const tokenOriginal = 'token_de_exemplo';
  criptografar(tokenOriginal).then(tokenCriptografado => {
	console.log('Token criptografado:', tokenCriptografado);
  
	descriptografar(tokenCriptografado).then(tokenDescriptografado => {
	  console.log('Token descriptografado:', tokenDescriptografado);
	});
  });
  


const clientId = 'u-s4t2ud-159130180b55795d9366f64e165fe220ae4cb2c8b5e412a3424d938148c1f337';

const uri = encodeURIComponent('http://127.0.0.1:8001/42/Transcendence/index.html');

const scope = encodeURIComponent('public');

const state = 'csrf_protect';

const urlAuth = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${uri}&response_type=code&scope=${scope}&state=${state}`;

export { urlAuth, uri };
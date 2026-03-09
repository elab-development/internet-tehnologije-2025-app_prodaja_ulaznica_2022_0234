export const handleApiError = (error: any): string => {
  // NE prikazuj stack trace ili sensitive data
  if (error.response) {
    const status = error.response.status;
    
    switch (status) {
      case 401:
        return 'Niste autorizovani. Prijavite se ponovo.';
      case 403:
        return 'Nemate pristup ovoj resursu.';
      case 404:
        return 'Resurs nije pronađen.';
      case 422:
        return error.response.data?.message || 'Podaci nisu validni.';
      case 429:
        return 'Previše zahteva. Pokušajte ponovo za nekoliko minuta.';
      case 500:
        return 'Greška na serveru. Pokušajte ponovo.';
      default:
        return 'Došlo je do greške. Pokušajte ponovo.';
    }
  } else if (error.request) {
    return 'Nema odgovora od servera. Proverite internet konekciju.';
  } else {
    return 'Došlo je do greške. Pokušajte ponovo.';
  }
};
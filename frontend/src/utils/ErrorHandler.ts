export const handleApiError = (error: any): string => {
  // NE prikazuj stack trace ili sensitive data
  if (error.response) {
    // Server odgovorio sa error status kodom
    const status = error.response.status;
    
    switch (status) {
      case 401:
        return 'Niste autorizovani. Prijavite se ponovo.';
      case 403:
        return 'Nemate pristup ovoj resursu.';
      case 404:
        return 'Resurs nije pronađen.';
      case 422:
        return error.response.data?.message || 'Validaciona greška.';
      case 500:
        return 'Greška na serveru. Pokušajte ponovo.';
      default:
        return 'Došlo je do greške. Pokušajte ponovo.';
    }
  } else if (error.request) {
    // Request poslan ali nema odgovora
    return 'Nema odgovora od servera. Proverite internet konekciju.';
  } else {
    // Greška pri pravljenju requesta
    return 'Došlo je do greške. Pokušajte ponovo.';
  }
};
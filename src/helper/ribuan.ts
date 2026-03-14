const formatRupiah = (value: number) => {
    if (!value) return '';
    return value.toLocaleString('id-ID');
};

const parseRupiah = (value: string) => {
    return parseInt(value.replace(/\D/g, '')) || 0;
};

export { formatRupiah, parseRupiah };
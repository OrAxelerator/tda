 const handleClick = async () => {
    if (!user) {
      setErrorMessage("Utilisateur non connecté");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch("/api/createGame", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ uid: user.uid }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = errorBody.message || "Impossible de créer la room";
        throw new Error(`${response.status} ${response.statusText}: ${message}`);
      }

      const data = await response.json();
      console.log("Room créée côté backend :", data);

      if (data?.roomId) {
        navigate(`/game/${data.roomId}`);
      } else {
        setErrorMessage("Room créée mais aucun ID retourné.");
      }
    } catch (err: any) {
      console.error("Erreur création room :", err);
      setErrorMessage(err?.message ?? "Erreur inconnue lors de la création de la room.");
    } finally {
      setIsLoading(false);
    }
  };